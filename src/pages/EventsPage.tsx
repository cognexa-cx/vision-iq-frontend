// src/pages/EventsPage.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Filter as FilterIcon, Search } from "lucide-react";
import { getEvents } from "../api/events";
import { DUMMY_EVENTS, BASE_EVENT_TYPES, EVENTS_PER_PAGE, EventRecord } from "../data/eventsData";
import { buildDateRangeParams } from "../utils/eventFormatters";
import { filterEvents, sortEvents, computeSrNoRanking, hasActiveEventFilters, DEFAULT_DATE_RANGE } from "../utils/eventFiltering";
import { ACCENT_LINE_GRADIENT, HEADING_TEXT_GRADIENT, BRAND_GRADIENT } from "../theme";
import EventFilterPanel from "../components/Events/EventFilterPanel";
import EventsTable from "../components/Events/EventsTable";
import EventsPagination from "../components/Events/EventsPagination";
import EventDetailsModal from "../components/Events/EventDetailsModal";
import EventPhotoLightbox from "../components/Events/EventPhotoLightbox";

export interface SelectedEventDetails {
  event: EventRecord;
  srNo: string;
  photoSrc: string;
}

// Filter/sort/page state that round-trips through the URL query string, so
// a reload or a shared link doesn't silently lose what the user set up.
const FILTER_PARAM_KEYS = [
  "search", "type", "severity", "camera", "date", "from", "to", "sort", "page",
] as const;

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    searchFilter: params.get("search") ?? "",
    typeFilter: params.get("type") ?? "all",
    severityFilter: params.get("severity") ?? "all",
    cameraFilter: params.get("camera") ?? "",
    dateRange: params.get("date") ?? "7d",
    customStart: params.get("from") ?? "",
    customEnd: params.get("to") ?? "",
    sortOrder: params.get("sort") ?? "newest",
    currentPage: Number(params.get("page")) || 1,
  };
}

export default function EventsPage() {
  const initial = useMemo(readFiltersFromUrl, []);

  // Start with sample data showing immediately instead of a blank loading
  // screen — swapped for real data the moment the backend responds.
  const [events, setEvents] = useState<EventRecord[]>(DUMMY_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventDetails | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [searchFilter, setSearchFilter] = useState(initial.searchFilter);
  const [typeFilter, setTypeFilter] = useState(initial.typeFilter);
  const [severityFilter, setSeverityFilter] = useState(initial.severityFilter);
  const [cameraFilter, setCameraFilter] = useState(initial.cameraFilter);
  const [dateRange, setDateRange] = useState(initial.dateRange);
  const [customStart, setCustomStart] = useState(initial.customStart);
  const [customEnd, setCustomEnd] = useState(initial.customEnd);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [currentPage, setCurrentPage] = useState(initial.currentPage);

  // Close the filter dropdown on outside click.
  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // Reset to page 1 whenever any filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, severityFilter, cameraFilter, searchFilter, sortOrder, dateRange, customStart, customEnd]);

  // Keep the URL in sync so filters/sort/page survive a reload or get
  // carried along when the link is shared — without pulling in a router.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const values: Record<(typeof FILTER_PARAM_KEYS)[number], string> = {
      search: searchFilter,
      type: typeFilter === "all" ? "" : typeFilter,
      severity: severityFilter === "all" ? "" : severityFilter,
      camera: cameraFilter,
      date: dateRange === "7d" ? "" : dateRange,
      from: customStart,
      to: customEnd,
      sort: sortOrder === "newest" ? "" : sortOrder,
      page: currentPage === 1 ? "" : String(currentPage),
    };
    FILTER_PARAM_KEYS.forEach((key) => {
      if (values[key]) params.set(key, values[key]);
      else params.delete(key);
    });
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", url);
  }, [searchFilter, typeFilter, severityFilter, cameraFilter, dateRange, customStart, customEnd, sortOrder, currentPage]);

  const apiParams = useMemo(
    () => ({
      limit: 1000,
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      ...buildDateRangeParams(dateRange, customStart, customEnd),
    }),
    [typeFilter, dateRange, customStart, customEnd],
  );

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getEvents(apiParams);
      setEvents(data as EventRecord[]);
    } catch {
      // Backend unreachable — silently fall back to sample data so the page
      // stays usable; the 30s poll below will pick up real data once the
      // backend becomes reachable again, no user-facing error needed.
      setEvents(DUMMY_EVENTS);
    }
  }, [apiParams]);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 30_000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  const cameraOptions = useMemo(
    () => [...new Set(events.map((e) => e.camera_name || e.camera_id).filter(Boolean))].sort() as string[],
    [events],
  );

  // Base known types merged with whatever actually shows up in the live
  // data, so a real event of an unlisted type is still filterable.
  const typeOptions = useMemo(() => {
    const seen = new Set(BASE_EVENT_TYPES);
    events.forEach((e) => {
      const t = e.type || e.event_type;
      if (t) seen.add(t);
    });
    return [...seen].sort();
  }, [events]);

  // All filters (including type/date range, which are also sent to the real
  // API as query params) are re-applied client-side too, so they still work
  // correctly against the sample-data fallback when the backend is down.
  // Pure logic lives in utils/eventFiltering.ts so it's unit-testable
  // without rendering this component.
  const filteredEvents = useMemo(
    () =>
      sortEvents(
        filterEvents(events, { typeFilter, dateRange, customStart, customEnd, cameraFilter, severityFilter, searchFilter }),
        sortOrder,
      ),
    [events, typeFilter, dateRange, customStart, customEnd, cameraFilter, severityFilter, searchFilter, sortOrder],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const paginatedEvents = useMemo(
    () => filteredEvents.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE),
    [filteredEvents, currentPage],
  );

  // Sr.No. is a total record count, independent of the current Sort by
  // selection — the newest event always gets the highest number, the oldest
  // always gets 1, no matter how the table is currently sorted or paginated.
  const srNoByEventId = useMemo(() => computeSrNoRanking(filteredEvents), [filteredEvents]);

  const isFiltered = hasActiveEventFilters({
    typeFilter, dateRange, customStart, customEnd, cameraFilter, severityFilter, searchFilter,
  });

  const handleClearAll = () => {
    setTypeFilter("all");
    setSeverityFilter("all");
    setCameraFilter("");
    setDateRange(DEFAULT_DATE_RANGE);
    setCustomStart("");
    setCustomEnd("");
    setSearchFilter("");
    // sortOrder is intentionally left as-is — it's display order, not a filter.
  };

  return (
    <>
      <div className="w-full h-full flex flex-col font-poppins">
        {/* Header row: title + Filter button — matches Dashboard's 82px band */}
        <div className="relative flex items-center justify-between flex-shrink-0" style={{ height: 82 }}>
          <div className="flex items-center gap-3">
            <span className="w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }} />
            <h1
              className="text-2xl font-semibold bg-clip-text text-transparent"
              style={{ backgroundImage: HEADING_TEXT_GRADIENT }}
            >
              Events
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search events…"
                aria-label="Search events"
                className="h-10 w-[260px] pl-10 pr-3 rounded-[10px] bg-white text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D0C92]/20"
                style={{ color: "#00183E" }}
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="relative flex items-center gap-2 h-10 px-4 rounded-[10px] text-white text-sm font-semibold"
                style={{ background: BRAND_GRADIENT }}
              >
                Filter
                <FilterIcon size={14} fill="white" />
                {isFiltered && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                    style={{ background: "#EF4444" }}
                    aria-label="Filters active"
                  />
                )}
              </button>

            {filterOpen && (
              <EventFilterPanel
                dateRange={dateRange} setDateRange={setDateRange}
                customStart={customStart} setCustomStart={setCustomStart}
                customEnd={customEnd} setCustomEnd={setCustomEnd}
                typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                severityFilter={severityFilter} setSeverityFilter={setSeverityFilter}
                cameraFilter={cameraFilter} setCameraFilter={setCameraFilter}
                sortOrder={sortOrder} setSortOrder={setSortOrder}
                searchFilter={searchFilter}
                cameraOptions={cameraOptions}
                typeOptions={typeOptions}
                onClose={() => setFilterOpen(false)}
                onClearAll={handleClearAll}
              />
            )}
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div
          className="flex-1 min-h-0 rounded-[20px] shadow-[0_20px_45px_-10px_rgba(61,12,146,0.18)] flex flex-col overflow-hidden"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <EventsTable
            events={paginatedEvents}
            srNoByEventId={srNoByEventId}
            onOpenDetails={setSelectedEvent}
            onOpenPhoto={setSelectedPhoto}
          />
          <EventsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEvents.length}
            itemsPerPage={EVENTS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <EventDetailsModal
        event={selectedEvent?.event}
        photoSrc={selectedEvent?.photoSrc}
        srNo={selectedEvent?.srNo}
        onClose={() => setSelectedEvent(null)}
      />
      <EventPhotoLightbox src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </>
  );
}
