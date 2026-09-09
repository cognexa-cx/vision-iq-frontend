// src/utils/eventFiltering.ts
// Pure filter/sort/ranking logic for the Events page, pulled out of the
// component so it's unit-testable without rendering React.
import { EventRecord, SEVERITY_ORDER } from "../data/eventsData";
import { buildDateRangeParams } from "./eventFormatters";

export interface EventFilters {
  typeFilter: string;
  dateRange: string;
  customStart: string;
  customEnd: string;
  cameraFilter: string;
  severityFilter: string;
  searchFilter: string;
}

const eventTimeMs = (e: EventRecord) => new Date(e.created_at || e.timestamp || 0).getTime();

/** Applies every Events-page filter (type, date range, camera, severity, search). */
export function filterEvents(events: EventRecord[], filters: EventFilters): EventRecord[] {
  const { typeFilter, dateRange, customStart, customEnd, cameraFilter, severityFilter, searchFilter } = filters;
  let result = events;

  if (typeFilter !== "all") {
    result = result.filter((e) => (e.type || e.event_type) === typeFilter);
  }

  const dateParams = buildDateRangeParams(dateRange, customStart, customEnd);
  if (dateParams.start) {
    const startMs = new Date(dateParams.start).getTime();
    const endMs = dateParams.end ? new Date(dateParams.end).getTime() : Infinity;
    result = result.filter((e) => {
      const t = eventTimeMs(e);
      return t >= startMs && t <= endMs;
    });
  }

  if (cameraFilter) {
    result = result.filter((e) => (e.camera_name || e.camera_id) === cameraFilter);
  }

  if (severityFilter !== "all") {
    result = result.filter((e) => e.severity === severityFilter);
  }

  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    result = result.filter(
      (e) =>
        String(e.camera_name || e.camera_id || "").toLowerCase().includes(q) ||
        String(e.type || e.event_type || "").toLowerCase().includes(q),
    );
  }

  return result;
}

// Matches EventsPage's initial state — kept here too so the "is anything
// filtered?" check has a single source of truth for what "default" means.
export const DEFAULT_DATE_RANGE = "7d";

/**
 * True if any filter actually narrows the result set (used to show/hide the
 * "Clear all" action and the active-filter badge on the Filter button).
 * Deliberately excludes sortOrder — sorting changes display order, not which
 * events are included, so it isn't a "filter" for this purpose.
 */
export function hasActiveEventFilters(filters: EventFilters): boolean {
  return (
    filters.typeFilter !== "all" ||
    filters.severityFilter !== "all" ||
    filters.cameraFilter !== "" ||
    filters.dateRange !== DEFAULT_DATE_RANGE ||
    filters.searchFilter !== ""
  );
}

export type SortOrder = "newest" | "oldest" | "severity";

/** Returns a new sorted array — never mutates the input. */
export function sortEvents(events: EventRecord[], sortOrder: SortOrder | string): EventRecord[] {
  return [...events].sort((a, b) => {
    if (sortOrder === "oldest") return eventTimeMs(a) - eventTimeMs(b);
    if (sortOrder === "severity") {
      return (SEVERITY_ORDER[a.severity as string] ?? 99) - (SEVERITY_ORDER[b.severity as string] ?? 99);
    }
    return eventTimeMs(b) - eventTimeMs(a); // "newest" (default)
  });
}

/**
 * Sr.No. is a total record count independent of the current Sort by
 * selection — the newest event always gets the highest number, the oldest
 * always gets 1, no matter how the table is currently sorted or paginated.
 */
export function computeSrNoRanking(events: EventRecord[]): Map<string | number, number> {
  const newestFirst = sortEvents(events, "newest");
  const map = new Map<string | number, number>();
  const total = newestFirst.length;
  newestFirst.forEach((e, i) => map.set(e.id, total - i));
  return map;
}
