import { describe, it, expect } from "vitest";
import { DUMMY_ZONES, DUMMY_ZONE_COUNT } from "./monitoringData";

describe("DUMMY_ZONES", () => {
  it("has DUMMY_ZONE_COUNT zones", () => {
    expect(DUMMY_ZONES).toHaveLength(DUMMY_ZONE_COUNT);
  });

  it("labels each zone sequentially as Zone 01, Zone 02, ...", () => {
    expect(DUMMY_ZONES.map((z) => z.label)).toEqual([
      "Zone 01", "Zone 02", "Zone 03", "Zone 04", "Zone 05", "Zone 06", "Zone 07", "Zone 08", "Zone 09",
    ]);
  });

  it("gives every zone at least one camera", () => {
    expect(DUMMY_ZONES.every((z) => z.cameras.length > 0)).toBe(true);
  });

  it("gives every camera a unique id", () => {
    const ids = DUMMY_ZONES.flatMap((z) => z.cameras.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every camera a name", () => {
    expect(DUMMY_ZONES.every((z) => z.cameras.every((c) => Boolean(c.name)))).toBe(true);
  });
});
