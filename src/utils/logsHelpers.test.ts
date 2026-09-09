import { describe, it, expect } from "vitest";
import {
  eventsToLogs,
  camerasToSystemLogs,
  camerasToErrorLogs,
  filterLogs,
  sortLogsNewestFirst,
  formatLogTime,
  buildLogsCsv,
} from "./logsHelpers";
import type { EventRecord } from "../data/eventsData";
import type { Camera } from "../types/camera";
import type { LogEntry } from "../data/logsData";

describe("eventsToLogs", () => {
  it("maps an event to a Detection log with a formatted alert name and camera/zone description", () => {
    const events: EventRecord[] = [
      { id: "e1", camera_name: "Main Gate", type: "animal", zone_no: "01", created_at: "2026-09-07T01:00:00" },
    ];
    const [log] = eventsToLogs(events);
    expect(log.category).toBe("Detection");
    expect(log.eventType).toBe("Animal Detection");
    expect(log.description).toBe("Detected on Main Gate, Zone 01");
    expect(log.status).toBe("Success");
    expect(log.time).toBe("2026-09-07T01:00:00");
  });

  it("falls back to camera_id and omits the zone clause when neither is present", () => {
    const events: EventRecord[] = [{ id: "e1", camera_id: "cam-9", type: "fall", created_at: "2026-09-07T01:00:00" }];
    const [log] = eventsToLogs(events);
    expect(log.description).toBe("Detected on cam-9");
  });
});

describe("camerasToSystemLogs", () => {
  it("adds a 'Camera Registered' Success entry for every camera", () => {
    const cameras: Camera[] = [{ id: "c1", name: "Main Gate", rtsp_url: "rtsp://a", enabled: true, created_at: "2026-09-07T01:00:00" }];
    const logs = camerasToSystemLogs(cameras);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ eventType: "Camera Registered", status: "Success", description: "Main Gate added to the system" });
  });

  it("adds an extra 'Camera Disabled' Warning entry for disabled cameras", () => {
    const cameras: Camera[] = [{ id: "c1", name: "Rooftop", rtsp_url: "rtsp://a", enabled: false, created_at: "2026-09-07T01:00:00" }];
    const logs = camerasToSystemLogs(cameras);
    expect(logs).toHaveLength(2);
    expect(logs[1]).toMatchObject({ eventType: "Camera Disabled", status: "Warning" });
  });
});

describe("camerasToErrorLogs", () => {
  it("returns an entry only for cameras with a last_error", () => {
    const cameras: Camera[] = [
      { id: "c1", name: "Main Gate", rtsp_url: "rtsp://a", status: { last_error: "Connection timeout" } },
      { id: "c2", name: "Warehouse", rtsp_url: "rtsp://b", status: {} },
      { id: "c3", name: "Parking", rtsp_url: "rtsp://c" },
    ];
    const logs = camerasToErrorLogs(cameras);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ category: "Error", status: "Failed", description: "Main Gate: Connection timeout" });
  });

  it("returns an empty array when no camera has an error", () => {
    const cameras: Camera[] = [{ id: "c1", name: "Main Gate", rtsp_url: "rtsp://a" }];
    expect(camerasToErrorLogs(cameras)).toEqual([]);
  });
});

function makeLog(overrides: Partial<LogEntry>): LogEntry {
  return { id: "l1", time: "2026-09-07T01:00:00", eventType: "Login", description: "Admin signed in", status: "Success", category: "User Activity", ...overrides };
}

describe("filterLogs", () => {
  const logs = [
    makeLog({ id: "1", status: "Success", eventType: "Login", description: "Admin signed in" }),
    makeLog({ id: "2", status: "Failed", eventType: "Login", description: "Bad password" }),
    makeLog({ id: "3", status: "Success", eventType: "Settings Change", description: "Updated notifications" }),
  ];

  it("returns everything when status is 'all' and search is empty", () => {
    expect(filterLogs(logs, { search: "", status: "all" })).toHaveLength(3);
  });

  it("filters by status", () => {
    const result = filterLogs(logs, { search: "", status: "Failed" });
    expect(result.map((l) => l.id)).toEqual(["2"]);
  });

  it("filters by a case-insensitive search over eventType and description", () => {
    expect(filterLogs(logs, { search: "SETTINGS", status: "all" }).map((l) => l.id)).toEqual(["3"]);
    expect(filterLogs(logs, { search: "password", status: "all" }).map((l) => l.id)).toEqual(["2"]);
  });

  it("combines status and search (AND, not OR)", () => {
    expect(filterLogs(logs, { search: "login", status: "Failed" }).map((l) => l.id)).toEqual(["2"]);
  });
});

describe("sortLogsNewestFirst", () => {
  it("sorts descending by time and does not mutate the input", () => {
    const logs = [
      makeLog({ id: "old", time: "2026-09-01T00:00:00" }),
      makeLog({ id: "new", time: "2026-09-09T00:00:00" }),
      makeLog({ id: "mid", time: "2026-09-05T00:00:00" }),
    ];
    const original = [...logs];
    expect(sortLogsNewestFirst(logs).map((l) => l.id)).toEqual(["new", "mid", "old"]);
    expect(logs).toEqual(original);
  });
});

describe("formatLogTime", () => {
  it("combines the date and time formatters", () => {
    expect(formatLogTime("2026-09-07T13:05:00")).toBe("07-09-2026 01:05pm");
  });
});

describe("buildLogsCsv", () => {
  it("builds a header row plus one row per log", () => {
    const csv = buildLogsCsv([makeLog({ time: "2026-09-07T01:00:00", eventType: "Login", description: "Admin signed in", status: "Success" })]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Time,Event Type,Description,Status");
    expect(lines[1]).toBe("07-09-2026 01:00am,Login,Admin signed in,Success");
  });

  it("returns just the header for an empty list", () => {
    expect(buildLogsCsv([])).toBe("Time,Event Type,Description,Status");
  });
});
