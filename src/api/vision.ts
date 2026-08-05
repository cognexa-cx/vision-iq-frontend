// ─── AI Vision Backend ──────────────────────────────────────────────────────
// New unified backend (replaces the old Main + Fire + PPE + Animal
// multi-service setup). One service manages "streams" (RTSP or uploaded
// video); detection "modules" (fire/ppe/animal) attach directly to a stream
// — no separate clone registry, and a single stream can have multiple
// modules enabled at once. Uses GPT-4o-mini/gpt-5-nano vision models under
// the hood, ~1 frame/second.
import { apiGet, apiPost, apiPostFormWithProgress, VISION_URL } from "./client";

export type VisionModule = "fire" | "ppe" | "animal";

export interface StreamInfo {
  stream_id: string;
  source_type: string; // "rtsp" | "file"
  backend: string;
  running: boolean;
  frame_count: number;
  active_modules: VisionModule[];
  created_at: number;
}

export interface StreamActionResponse {
  stream_id: string;
  status: string;
}

// ─── Streams ──────────────────────────────────────────────────────────────

/** POST /api/v1/streams/rtsp/start */
export const startRtspStream = (
  rtsp_url: string,
  stream_id?: string,
): Promise<StreamActionResponse> =>
  apiPost(
    "/api/v1/streams/rtsp/start",
    { rtsp_url, stream_id },
    VISION_URL,
  );

/** POST /api/v1/streams/upload (multipart) — reports real upload progress. */
export const uploadStream = (
  file: File,
  onProgress?: (pct: number) => void,
  stream_id?: string,
): Promise<StreamActionResponse> => {
  const form = new FormData();
  form.append("file", file);
  if (stream_id) form.append("stream_id", stream_id);
  return apiPostFormWithProgress(
    "/api/v1/streams/upload",
    form,
    onProgress ?? (() => {}),
    VISION_URL,
  );
};

/** POST /api/v1/streams/{stream_id}/stop */
export const stopStream = (streamId: string): Promise<StreamActionResponse> =>
  apiPost(`/api/v1/streams/${streamId}/stop`, null, VISION_URL);

/** GET /api/v1/streams */
export const listStreams = (): Promise<StreamInfo[]> =>
  apiGet("/api/v1/streams", VISION_URL);

// ─── Detection modules ────────────────────────────────────────────────────

/**
 * POST /api/v1/{module}/stream/{stream_id}/enable
 * Attaches a continuous ~1fps detection loop for this module to the stream.
 * There is no matching "disable" endpoint today — only stopping the whole
 * stream removes it.
 */
export const enableModule = (
  module: VisionModule,
  streamId: string,
): Promise<StreamActionResponse> =>
  apiPost(`/api/v1/${module}/stream/${streamId}/enable`, null, VISION_URL);

export interface FireDetectResult {
  is_fire?: boolean;
  is_smoke?: boolean;
  bounding_box?: number[] | number[][];
  [key: string]: unknown;
}

export interface PpeDetectResult {
  compliant?: boolean;
  missing_items?: string[];
  bounding_box?: number[] | number[][];
  [key: string]: unknown;
}

export interface AnimalDetectResult {
  is_animal?: boolean;
  is_wild_animal?: boolean;
  category?: string | null;
  bounding_box?: number[] | number[][];
  [key: string]: unknown;
}

/**
 * POST /api/v1/{module}/detect — one-shot detection against a stream's
 * latest frame (or an uploaded image directly). Confirmed live response
 * shape for animal: {is_animal, is_wild_animal, category, bounding_box}.
 * Fire/PPE shapes are analogous but not yet confirmed field-by-field.
 */
export const detectOnce = <
  T = FireDetectResult | PpeDetectResult | AnimalDetectResult,
>(
  module: VisionModule,
  opts: { streamId?: string; file?: File },
): Promise<T> => {
  const form = new FormData();
  if (opts.streamId) form.append("stream_id", opts.streamId);
  if (opts.file) form.append("file", opts.file);
  return apiPostFormWithProgress(
    `/api/v1/${module}/detect`,
    form,
    () => {},
    VISION_URL,
  );
};

// ─── Health ────────────────────────────────────────────────────────────────

export interface VisionHealth {
  status: string;
  vision_backends?: string[];
  active_streams?: StreamInfo[];
  [key: string]: unknown;
}

/** GET /health */
export const getVisionHealth = (): Promise<VisionHealth> =>
  apiGet("/health", VISION_URL);
