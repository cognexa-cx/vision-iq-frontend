// src/pages/LogsPage.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Filter as FilterIcon, Search, Download } from "lucide-react";
import { getCameras } from "../api/cameras";
import { getEvents } from "../api/events";
import { DUMMY_EVENTS, EventRecord } from "../data/eventsData";
import { LogEntry, LogCategory, DUMMY_SYSTEM_LOGS, DUMMY_ERROR_LOGS, DUMMY_USER_ACTIVITY_LOGS } from "../data/logsData";
import { eventsToLogs, camerasToSystemLogs, camerasToErrorLogs, filterLogs, sortLogsNewestFirst, buildLogsCsv } from "../utils/logsHelpers";
import { ACCENT_LINE_GRADIENT, HEADING_TEXT_GRADIENT, BRAND_GRADIENT } from "../theme";
import LogsCategoryTabs from "../components/Logs/LogsCategoryTabs";
import LogsFilterPanel from "../components/Logs/LogsFilterPanel";
import LogsTable from "../components/Logs/LogsTable";

export default function LogsPage() {
  const [category, setCategory] = useState<LogCategory>("Systems");
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>(DUMMY_SYSTEM_LOGS);
  const [errorLogs, setErrorLogs] = useState<LogEntry[]>(DUMMY_ERROR_LOGS);
  const [detectionLogs, setDetectionLogs] = useState<LogEntry[]>(eventsToLogs(DUMMY_EVENTS));

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const cameras = await getCameras();
      setSystemLogs(cameras.length > 0 ? camerasToSystemLogs(cameras) : DUMMY_SYSTEM_LOGS);
      const realErrorLogs = camerasToErrorLogs(cameras);
      setErrorLogs(realErrorLogs.length > 0 ? realErrorLogs : DUMMY_ERROR_LOGS);
    } catch {
      // Backend unreachable — keep showing sample Systems/Error logs.
      setSystemLogs(DUMMY_SYSTEM_LOGS);
      setErrorLogs(DUMMY_ERROR_LOGS);
    }

    try {
      const events = await getEvents({ limit: 50 });
      setDetectionLogs(eventsToLogs(events as EventRecord[]));
    } catch {
      setDetectionLogs(eventsToLogs(DUMMY_EVENTS));
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 30_000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  const logsByCategory: Record<LogCategory, LogEntry[]> = {
    Systems: systemLogs,
    Detection: detectionLogs,
    Error: errorLogs,
    "User Activity": DUMMY_USER_ACTIVITY_LOGS,
  };

  const filteredLogs = useMemo(
    () => sortLogsNewestFirst(filterLogs(logsByCategory[category], { search, status })),
    [logsByCategory, category, search, status],
  );

  const isFiltered = status !== "all";

  const handleClearAll = () => setStatus("all");

  const handleDownload = () => {
    const blob = new Blob([buildLogsCsv(filteredLogs)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category.toLowerCase().replace(" ", "-")}-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col font-poppins">
      <div className="relative flex items-center flex-shrink-0" style={{ height: 82 }}>
        <div className="flex items-center gap-3">
          <span className="w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }} />
          <h1 className="text-2xl font-semibold bg-clip-text text-transparent" style={{ backgroundImage: HEADING_TEXT_GRADIENT }}>
            Logs
          </h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LogsCategoryTabs active={category} onChange={setCategory} />

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[160px] sm:flex-none">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs…"
                aria-label="Search logs"
                className="h-10 w-full sm:w-[220px] pl-10 pr-3 rounded-[10px] bg-white text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D0C92]/20"
                style={{ color: "#00183E" }}
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="relative flex items-center gap-2 h-10 px-4 rounded-[10px] text-white text-sm font-semibold"
                style={{ background: BRAND_GRADIENT }}
              >
                Filter <FilterIcon size={14} fill="white" />
                {isFiltered && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: "#EF4444" }} aria-label="Filters active" />
                )}
              </button>

              {filterOpen && (
                <LogsFilterPanel
                  status={status}
                  setStatus={setStatus}
                  onClose={() => setFilterOpen(false)}
                  onClearAll={handleClearAll}
                  isFiltered={isFiltered}
                />
              )}
            </div>

            <button
              onClick={handleDownload}
              aria-label="Download logs as CSV"
              className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-white"
              style={{ color: "#3D0C92", border: "1.5px solid #3D0C92" }}
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        <div
          className="min-h-[180px] max-h-full rounded-[20px] shadow-[0_20px_45px_-10px_rgba(61,12,146,0.18)] flex flex-col overflow-hidden"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <LogsTable logs={filteredLogs} />
        </div>
      </div>
    </div>
  );
}
