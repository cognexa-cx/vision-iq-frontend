// src/components/Events/EventFilterPanel.tsx
import { useEffect } from "react";
import { X } from "lucide-react";
import { DATE_RANGE_OPTIONS, SEVERITY_OPTIONS } from "../../data/eventsData";
import { hasActiveEventFilters } from "../../utils/eventFiltering";

const selectCls =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3D0C92]/20";

export interface EventFilterPanelProps {
  dateRange: string;
  setDateRange: (v: string) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  severityFilter: string;
  setSeverityFilter: (v: string) => void;
  cameraFilter: string;
  setCameraFilter: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  searchFilter: string;
  cameraOptions: string[];
  typeOptions: string[];
  onClose: () => void;
  onClearAll: () => void;
}

export default function EventFilterPanel({
  dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd,
  typeFilter, setTypeFilter, severityFilter, setSeverityFilter,
  cameraFilter, setCameraFilter, sortOrder, setSortOrder, searchFilter,
  cameraOptions, typeOptions, onClose, onClearAll,
}: EventFilterPanelProps) {
  // Close on Escape — same keyboard affordance as every other overlay here.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isFiltered = hasActiveEventFilters({
    typeFilter, dateRange, customStart, customEnd, cameraFilter, severityFilter, searchFilter,
  });

  // Native date-input constraints prevent picking an inverted range from the
  // calendar UI; typing an invalid one manually still just yields zero
  // results (harmless), but this stops the common case at the source.
  const dateRangeInvalid = Boolean(customStart && customEnd && customStart > customEnd);

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] w-[320px] bg-white rounded-2xl shadow-[0_20px_45px_-10px_rgba(61,12,146,0.25)] border border-[rgba(97,32,214,0.08)] p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <p className="font-poppins text-sm font-semibold" style={{ color: "#00183E" }}>
          Filters
        </p>
        <div className="flex items-center gap-3">
          {isFiltered && (
            <button onClick={onClearAll} className="text-xs font-semibold hover:underline" style={{ color: "#3D0C92" }}>
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close filters">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date range</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={selectCls}>
            {DATE_RANGE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {dateRange === "custom" && (
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
                className={selectCls}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={selectCls}
              />
            </div>
            {dateRangeInvalid && (
              <p className="text-xs" style={{ color: "#B91C1C" }}>
                "From" must be before "To" — showing no results until fixed.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Alert type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="all">All Types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Camera</label>
          <select value={cameraFilter} onChange={(e) => setCameraFilter(e.target.value)} className={selectCls}>
            <option value="">All Cameras</option>
            {cameraOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Severity</label>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectCls}>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Severities" : s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sort by</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={selectCls}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="severity">Severity</option>
          </select>
        </div>
      </div>
    </div>
  );
}
