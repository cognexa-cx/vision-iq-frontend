import { describe, it, expect } from "vitest";
import {
  parseCameraCsv,
  buildCameraCsvTemplate,
  toggleDetectionTag,
  countCamerasWithType,
  hasUnsavedTagChanges,
  KNOWN_DETECTION_KEYS,
} from "./cameraMasterHelpers";

describe("parseCameraCsv", () => {
  it("parses valid name,rtsp_url rows", () => {
    const { rows, skipped } = parseCameraCsv("Main Gate,rtsp://a\nWarehouse,rtsp://b");
    expect(rows).toEqual([
      { name: "Main Gate", rtsp_url: "rtsp://a" },
      { name: "Warehouse", rtsp_url: "rtsp://b" },
    ]);
    expect(skipped).toBe(0);
  });

  it("skips the header row if present", () => {
    const { rows } = parseCameraCsv("name,rtsp_url\nMain Gate,rtsp://a");
    expect(rows).toEqual([{ name: "Main Gate", rtsp_url: "rtsp://a" }]);
  });

  it("skips blank lines", () => {
    const { rows } = parseCameraCsv("Main Gate,rtsp://a\n\n\nWarehouse,rtsp://b");
    expect(rows).toHaveLength(2);
  });

  it("counts rows missing either column as skipped, not included in rows", () => {
    const { rows, skipped } = parseCameraCsv("Main Gate,rtsp://a\nNoUrlHere\nWarehouse,rtsp://b");
    expect(rows).toHaveLength(2);
    expect(skipped).toBe(1);
  });

  it("returns an empty result for an empty string", () => {
    expect(parseCameraCsv("")).toEqual({ rows: [], skipped: 0 });
  });
});

describe("buildCameraCsvTemplate", () => {
  it("includes the header and an example row", () => {
    const csv = buildCameraCsvTemplate();
    expect(csv).toContain("name,rtsp_url");
    expect(csv.split("\n").filter(Boolean)).toHaveLength(2);
  });

  it("round-trips through parseCameraCsv as a single valid row", () => {
    const { rows } = parseCameraCsv(buildCameraCsvTemplate());
    expect(rows).toHaveLength(1);
  });
});

describe("toggleDetectionTag", () => {
  it("adds a tag when checked and not already present", () => {
    expect(toggleDetectionTag([], "animal_detection", true)).toEqual(["animal_detection"]);
  });

  it("does not duplicate a tag that's already present", () => {
    expect(toggleDetectionTag(["animal_detection"], "animal_detection", true)).toEqual(["animal_detection"]);
  });

  it("removes a tag when unchecked", () => {
    expect(toggleDetectionTag(["animal_detection", "crowd_detection"], "animal_detection", false)).toEqual(["crowd_detection"]);
  });

  it("is a no-op when unchecking a tag that isn't present", () => {
    expect(toggleDetectionTag(["crowd_detection"], "animal_detection", false)).toEqual(["crowd_detection"]);
  });

  it("does not mutate the input array", () => {
    const input = ["animal_detection"];
    toggleDetectionTag(input, "crowd_detection", true);
    expect(input).toEqual(["animal_detection"]);
  });
});

describe("countCamerasWithType", () => {
  it("counts how many cameras have a given type in their draft tags", () => {
    const draft = {
      cam1: ["animal_detection"],
      cam2: ["animal_detection", "crowd_detection"],
      cam3: ["crowd_detection"],
    };
    expect(countCamerasWithType(draft, "animal_detection")).toBe(2);
    expect(countCamerasWithType(draft, "crowd_detection")).toBe(2);
    expect(countCamerasWithType(draft, "intruder_detection")).toBe(0);
  });

  it("returns 0 for an empty map", () => {
    expect(countCamerasWithType({}, "animal_detection")).toBe(0);
  });
});

describe("hasUnsavedTagChanges", () => {
  it("is false when saved and draft are identical", () => {
    const tags = { cam1: ["animal_detection"] };
    expect(hasUnsavedTagChanges(tags, { cam1: ["animal_detection"] })).toBe(false);
  });

  it("is false when the same tags are in a different order", () => {
    const saved = { cam1: ["animal_detection", "crowd_detection"] };
    const draft = { cam1: ["crowd_detection", "animal_detection"] };
    expect(hasUnsavedTagChanges(saved, draft)).toBe(false);
  });

  it("is true when a tag was added", () => {
    expect(hasUnsavedTagChanges({ cam1: [] }, { cam1: ["animal_detection"] })).toBe(true);
  });

  it("is true when a tag was removed", () => {
    expect(hasUnsavedTagChanges({ cam1: ["animal_detection"] }, { cam1: [] })).toBe(true);
  });

  it("is true when a camera exists only in one map", () => {
    expect(hasUnsavedTagChanges({}, { cam1: ["animal_detection"] })).toBe(true);
  });
});

describe("KNOWN_DETECTION_KEYS", () => {
  it("contains the three configured detection types", () => {
    expect(KNOWN_DETECTION_KEYS.has("animal_detection")).toBe(true);
    expect(KNOWN_DETECTION_KEYS.has("crowd_detection")).toBe(true);
    expect(KNOWN_DETECTION_KEYS.has("intruder_detection")).toBe(true);
    expect(KNOWN_DETECTION_KEYS.has("something_else")).toBe(false);
  });
});
