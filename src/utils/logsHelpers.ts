// src/utils/logsHelpers.ts
// Pure helpers for the Logs page, pulled out of components so they're
// unit-testable without rendering React.
import type { Camera } from "../types/camera";
import type { EventRecord } from "../data/eventsData";
import type { LogEntry, LogCategory, LogStatus } from "../data/logsData";
import { formatAlertName, formatEventDate, formatEventTime } from "./eventFormatters";

/** Detection logs are real Events-API data, not a mock. */
export function eventsToLogs(events: EventRecord[]): LogEntry[] {
  return events.map((e) => {
    const ts = e.created_at || e.timestamp || new Date().toISOString();
    const camera = e.camera_name || e.camera_id || "unknown camera";
    return {
      id: `detection-${e.id}`,
      time: ts,
      eventType: formatAlertName(e.type || e.event_type),
      description: `Detected on ${camera}${e.zone_no || e.zone ? `, Zone ${e.zone_no ?? e.zone}` : ""}`,
      status: "Success" as LogStatus,
      category: "Detection" as LogCategory,
    };
  });
}

/** Systems logs are real camera-lifecycle data (registration/enabled state), not a mock. */
export function camerasToSystemLogs(cameras: Camera[]): LogEntry[] {
  const logs: LogEntry[] = [];
  for (const c of cameras) {
    logs.push({
      id: `sys-created-${c.id}`,
      time: c.created_at || new Date().toISOString(),
      eventType: "Camera Registered",
      description: `${c.name} added to the system`,
      status: "Success",
      category: "Systems",
    });
    if (c.enabled === false) {
      logs.push({
        id: `sys-disabled-${c.id}`,
        time: c.created_at || new Date().toISOString(),
        eventType: "Camera Disabled",
        description: `${c.name} disabled`,
        status: "Warning",
        category: "Systems",
      });
    }
  }
  return logs;
}

/** Error logs are real when a camera reports a health error; otherwise empty (caller falls back to sample data). */
export function camerasToErrorLogs(cameras: Camera[]): LogEntry[] {
  return cameras
    .filter((c) => c.status?.last_error)
    .map((c) => ({
      id: `err-${c.id}`,
      time: c.status?.last_frame_ts || c.created_at || new Date().toISOString(),
      eventType: "Camera Error",
      description: `${c.name}: ${c.status?.last_error}`,
      status: "Failed" as LogStatus,
      category: "Error" as LogCategory,
    }));
}

export interface LogFilters {
  search: string;
  status: string; // "all" | LogStatus
}

export function filterLogs(logs: LogEntry[], filters: LogFilters): LogEntry[] {
  let result = logs;
  if (filters.status !== "all") {
    result = result.filter((l) => l.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.eventType.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q),
    );
  }
  return result;
}

export function sortLogsNewestFirst(logs: LogEntry[]): LogEntry[] {
  return [...logs].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function formatLogTime(iso: string): string {
  return `${formatEventDate(iso)} ${formatEventTime(iso)}`;
}

/** Builds a downloadable CSV of the given logs — no escaping needed since none of these fields ever contain commas/quotes today. */
export function buildLogsCsv(logs: LogEntry[]): string {
  const header = "Time,Event Type,Description,Status";
  const rows = logs.map((l) => `${formatLogTime(l.time)},${l.eventType},${l.description},${l.status}`);
  return [header, ...rows].join("\n");
}
