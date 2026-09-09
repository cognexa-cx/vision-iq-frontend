import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatEventDate, formatEventTime, formatAlertName, buildDateRangeParams } from "./eventFormatters";

describe("formatEventDate", () => {
  it("formats as DD-MM-YYYY", () => {
    expect(formatEventDate("2026-09-07T01:00:00")).toBe("07-09-2026");
  });

  it("zero-pads single-digit day and month", () => {
    expect(formatEventDate("2026-01-05T00:00:00")).toBe("05-01-2026");
  });
});

describe("formatEventTime", () => {
  it("formats midnight as 12:00am", () => {
    expect(formatEventTime("2026-09-07T00:00:00")).toBe("12:00am");
  });

  it("formats noon as 12:00pm", () => {
    expect(formatEventTime("2026-09-07T12:00:00")).toBe("12:00pm");
  });

  it("formats a morning time with am", () => {
    expect(formatEventTime("2026-09-07T08:05:00")).toBe("08:05am");
  });

  it("formats an evening time with pm", () => {
    expect(formatEventTime("2026-09-07T23:00:00")).toBe("11:00pm");
  });
});

describe("formatAlertName", () => {
  it("returns an em dash for a missing type", () => {
    expect(formatAlertName(undefined)).toBe("—");
  });

  it("title-cases a single word and appends Detection", () => {
    expect(formatAlertName("animal")).toBe("Animal Detection");
  });

  it("title-cases each word for multi-word/underscored types", () => {
    expect(formatAlertName("fall_detection")).toBe("Fall Detection");
  });

  it("doesn't double up Detection if already present", () => {
    expect(formatAlertName("intrusion detection")).toBe("Intrusion Detection");
  });
});

describe("buildDateRangeParams", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("'today' starts at local midnight", () => {
    const { start, end } = buildDateRangeParams("today");
    expect(end).toBeUndefined();
    expect(new Date(start!).getHours()).toBe(0);
    expect(new Date(start!).getMinutes()).toBe(0);
  });

  it("'7d' starts 7 days before now", () => {
    const { start } = buildDateRangeParams("7d");
    const days = (Date.now() - new Date(start!).getTime()) / 86_400_000;
    expect(days).toBeCloseTo(7, 5);
  });

  it("'30d' starts 30 days before now", () => {
    const { start } = buildDateRangeParams("30d");
    const days = (Date.now() - new Date(start!).getTime()) / 86_400_000;
    expect(days).toBeCloseTo(30, 5);
  });

  it("'custom' with only a start date has no end bound", () => {
    const { start, end } = buildDateRangeParams("custom", "2026-09-01");
    expect(start).toBe(new Date("2026-09-01").toISOString());
    expect(end).toBeUndefined();
  });

  it("'custom' with start and end includes end-of-day on the end date", () => {
    const { start, end } = buildDateRangeParams("custom", "2026-09-01", "2026-09-05");
    expect(start).toBe(new Date("2026-09-01").toISOString());
    expect(end).toBe(new Date("2026-09-05T23:59:59").toISOString());
  });

  it("'custom' with no start returns no bounds at all", () => {
    expect(buildDateRangeParams("custom")).toEqual({});
  });

  it("an unrecognized range returns no bounds", () => {
    expect(buildDateRangeParams("all-time")).toEqual({});
  });
});
