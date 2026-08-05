import { apiGet, apiPostForm, BASE_URL } from "./client";

/**
 * GET /api/test-lab/models → string[]
 * Returns list of available model names
 */
export const getTestLabModels = (): Promise<string[]> =>
  apiGet("/api/test-lab/models");

/**
 * POST /api/test-lab/run → { session_id, ... }
 * body: FormData with file + model + optional params
 *
 * Usage:
 *   const form = new FormData();
 *   form.append("file", videoFile);
 *   form.append("model", "yolo11l");
 *   runTestLab(form);
 */
export const runTestLab = (
  formData: FormData,
): Promise<{ session_id: string; [key: string]: unknown }> =>
  apiPostForm("/api/test-lab/run", formData);

/**
 * GET /api/test-lab/results/{filename}
 * Returns processed result file (JSON / video)
 */
export const getTestLabResult = (filename: string): Promise<unknown> =>
  apiGet(`/api/test-lab/results/${filename}`);

/**
 * Result file URL — use for direct download link
 * <a href={getTestLabResultUrl(filename)} download>
 */
export const getTestLabResultUrl = (filename: string): string =>
  `${BASE_URL}/api/test-lab/results/${filename}`;

/**
 * GET /api/test-lab/frames/{session_id}/{frame_index}
 * Use as <img src={getTestLabFrameUrl(sessionId, frameIndex)}>
 */
export const getTestLabFrameUrl = (
  sessionId: string,
  frameIndex: number | string,
): string => `${BASE_URL}/api/test-lab/frames/${sessionId}/${frameIndex}`;

/**
 * Fetch a specific frame as JSON/blob via API.
 * For most cases, use getTestLabFrameUrl() directly as <img src>
 */
export const getTestLabFrame = (
  sessionId: string,
  frameIndex: number | string,
): Promise<unknown> =>
  apiGet(`/api/test-lab/frames/${sessionId}/${frameIndex}`);
