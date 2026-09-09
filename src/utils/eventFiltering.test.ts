import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { filterEvents, sortEvents, computeSrNoRanking, hasActiveEventFilters, EventFilters } from "./eventFiltering";
import { EventRecord } from "../data/eventsData";

const baseFilters: EventFilters = {
  typeFilter: "all",
  dateRange: "7d",
  customStart: "",
  customEnd: "",
  cameraFilter: "",
  severityFilter: "all",
  searchFilter: "",
};

function makeEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: "e1",
    camera_id: "cam-1",
    type: "animal",
    severity: "medium",
    created_at: "2026-09-07T01:00:00Z",
    ...overrides,
  };
}

describe("filterEvents", () => {
  const events: EventRecord[] = [
    makeEvent({ id: 1, type: "animal", severity: "low", camera_id: "cam-1" }),
    makeEvent({ id: 2, type: "fall", severity: "critical", camera_id: "cam-2" }),
    makeEvent({ id: 3, type: "intrusion", severity: "high", camera_id: "cam-1" }),
  ];

  it("returns everything when every filter is at its default", () => {
    expect(filterEvents(events, baseFilters)).toHaveLength(3);
  });

  it("filters by alert type", () => {
    const result = filterEvents(events, { ...baseFilters, typeFilter: "fall" });
    expect(result.map((e) => e.id)).toEqual([2]);
  });

  it("filters by severity", () => {
    const result = filterEvents(events, { ...baseFilters, severityFilter: "critical" });
    expect(result.map((e) => e.id)).toEqual([2]);
  });

  it("filters by camera", () => {
    const result = filterEvents(events, { ...baseFilters, cameraFilter: "cam-1" });
    expect(result.map((e) => e.id)).toEqual([1, 3]);
  });

  it("filters by a case-insensitive search matching camera or type", () => {
    const result = filterEvents(events, { ...baseFilters, searchFilter: "INTRUSION" });
    expect(result.map((e) => e.id)).toEqual([3]);
  });

  it("combines multiple filters (AND, not OR)", () => {
    const result = filterEvents(events, { ...baseFilters, cameraFilter: "cam-1", severityFilter: "high" });
    expect(result.map((e) => e.id)).toEqual([3]);
  });

  it("returns an empty array when nothing matches", () => {
    const result = filterEvents(events, { ...baseFilters, typeFilter: "vehicle" });
    expect(result).toEqual([]);
  });

  describe("date range filtering", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    });
    afterEach(() => vi.useRealTimers());

    it("'today' excludes events from previous days", () => {
      const todayEvents = [
        makeEvent({ id: 1, created_at: new Date().toISOString() }),
        makeEvent({ id: 2, created_at: "2026-09-07T01:00:00Z" }),
      ];
      const result = filterEvents(todayEvents, { ...baseFilters, dateRange: "today" });
      expect(result.map((e) => e.id)).toEqual([1]);
    });

    it("a custom range excludes events outside the from/to bounds", () => {
      const spread = [
        makeEvent({ id: 1, created_at: "2026-08-01T00:00:00Z" }), // before range
        makeEvent({ id: 2, created_at: "2026-09-03T00:00:00Z" }), // inside range
        makeEvent({ id: 3, created_at: "2026-09-20T00:00:00Z" }), // after range
      ];
      const result = filterEvents(spread, {
        ...baseFilters,
        dateRange: "custom",
        customStart: "2026-09-01",
        customEnd: "2026-09-10",
      });
      expect(result.map((e) => e.id)).toEqual([2]);
    });
  });
});

describe("sortEvents", () => {
  const events: EventRecord[] = [
    makeEvent({ id: "mid", created_at: "2026-09-07T12:00:00Z", severity: "medium" }),
    makeEvent({ id: "newest", created_at: "2026-09-09T00:00:00Z", severity: "low" }),
    makeEvent({ id: "oldest", created_at: "2026-09-01T00:00:00Z", severity: "critical" }),
  ];

  it("'newest' (default) sorts descending by time", () => {
    expect(sortEvents(events, "newest").map((e) => e.id)).toEqual(["newest", "mid", "oldest"]);
  });

  it("'oldest' sorts ascending by time", () => {
    expect(sortEvents(events, "oldest").map((e) => e.id)).toEqual(["oldest", "mid", "newest"]);
  });

  it("'severity' sorts critical first, then high/medium/low", () => {
    expect(sortEvents(events, "severity").map((e) => e.id)).toEqual(["oldest", "mid", "newest"]);
  });

  it("does not mutate the input array", () => {
    const original = [...events];
    sortEvents(events, "oldest");
    expect(events).toEqual(original);
  });
});

describe("computeSrNoRanking", () => {
  it("assigns the highest number to the newest event and 1 to the oldest", () => {
    const events: EventRecord[] = [
      makeEvent({ id: "a", created_at: "2026-09-05T00:00:00Z" }),
      makeEvent({ id: "b", created_at: "2026-09-09T00:00:00Z" }),
      makeEvent({ id: "c", created_at: "2026-09-01T00:00:00Z" }),
    ];
    const ranking = computeSrNoRanking(events);
    expect(ranking.get("b")).toBe(3); // newest
    expect(ranking.get("a")).toBe(2);
    expect(ranking.get("c")).toBe(1); // oldest
  });

  it("ranking is independent of the input array's own order", () => {
    const chronological: EventRecord[] = [
      makeEvent({ id: "oldest", created_at: "2026-09-01T00:00:00Z" }),
      makeEvent({ id: "newest", created_at: "2026-09-09T00:00:00Z" }),
    ];
    const reversed = [...chronological].reverse();
    expect(computeSrNoRanking(chronological)).toEqual(computeSrNoRanking(reversed));
  });

  it("returns an empty map for an empty list", () => {
    expect(computeSrNoRanking([]).size).toBe(0);
  });
});

describe("hasActiveEventFilters", () => {
  it("is false when every filter is at its default", () => {
    expect(hasActiveEventFilters(baseFilters)).toBe(false);
  });

  it("is true when the type filter is set", () => {
    expect(hasActiveEventFilters({ ...baseFilters, typeFilter: "fall" })).toBe(true);
  });

  it("is true when the severity filter is set", () => {
    expect(hasActiveEventFilters({ ...baseFilters, severityFilter: "critical" })).toBe(true);
  });

  it("is true when a camera is selected", () => {
    expect(hasActiveEventFilters({ ...baseFilters, cameraFilter: "cam-1" })).toBe(true);
  });

  it("is true when the date range isn't the 7d default", () => {
    expect(hasActiveEventFilters({ ...baseFilters, dateRange: "today" })).toBe(true);
  });

  it("is true when there's a search term", () => {
    expect(hasActiveEventFilters({ ...baseFilters, searchFilter: "cam-1" })).toBe(true);
  });
});
