// src/utils/cameraMasterHelpers.ts
// Pure helpers for Camera Master, pulled out of components so they're
// unit-testable without rendering React.
import { DETECTION_TYPES, CSV_TEMPLATE_HEADER, CSV_TEMPLATE_EXAMPLE_ROW } from "../data/cameraMasterData";

export interface ParsedCameraRow {
  name: string;
  rtsp_url: string;
}

export interface CsvParseResult {
  rows: ParsedCameraRow[];
  skipped: number;
}

/**
 * Parses a "name,rtsp_url" CSV — deliberately simple (no quoted-field/escaping
 * support) since the only producer of this file is our own Download Template
 * button. Skips the header row (if present), blank lines, and any row
 * missing either column.
 */
export function parseCameraCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let skipped = 0;
  const rows: ParsedCameraRow[] = [];

  for (const line of lines) {
    const [rawName, rawUrl] = line.split(",").map((s) => s?.trim());
    if (rawName?.toLowerCase() === "name" && rawUrl?.toLowerCase() === "rtsp_url") continue; // header
    if (!rawName || !rawUrl) {
      skipped++;
      continue;
    }
    rows.push({ name: rawName, rtsp_url: rawUrl });
  }

  return { rows, skipped };
}

export function buildCameraCsvTemplate(): string {
  return `${CSV_TEMPLATE_HEADER}\n${CSV_TEMPLATE_EXAMPLE_ROW}\n`;
}

/** Toggles a detection-type tag in a camera's tag list, returning a new array. */
export function toggleDetectionTag(tags: string[], typeKey: string, checked: boolean): string[] {
  if (checked) return tags.includes(typeKey) ? tags : [...tags, typeKey];
  return tags.filter((t) => t !== typeKey);
}

/** How many cameras (by their current draft tags) have a given detection type enabled. */
export function countCamerasWithType(draftTags: Record<string, string[]>, typeKey: string): number {
  return Object.values(draftTags).filter((tags) => tags.includes(typeKey)).length;
}

/** True if any camera's draft tags differ from its last-saved tags. */
export function hasUnsavedTagChanges(
  savedTags: Record<string, string[]>,
  draftTags: Record<string, string[]>,
): boolean {
  const ids = new Set([...Object.keys(savedTags), ...Object.keys(draftTags)]);
  for (const id of ids) {
    const saved = [...(savedTags[id] ?? [])].sort();
    const draft = [...(draftTags[id] ?? [])].sort();
    if (saved.length !== draft.length || saved.some((t, i) => t !== draft[i])) return true;
  }
  return false;
}

export const KNOWN_DETECTION_KEYS = new Set(DETECTION_TYPES.map((t) => t.key));
