import { apiGet, apiPost, FIRE_URL } from "./client";

// ─── Fire & Smoke Detection — RTSP live camera ───────────────────────────────
// Standalone microservice (VITE_FIRE_URL). Sessions are keyed by job_id,
// independent of the Main backend's camera/clone registry.

export interface RtspStartResponse {
  job_id?: string;
  id?: string;
  [key: string]: unknown;
}

export interface RtspSession {
  job_id: string;
  id?: string;
  name?: string | null;
  rtsp_url: string;
  status: "error" | string;
}

// The backend has been observed returning either a bare array or an
// envelope like { value: [...], Count: N } — callers should normalize.
export type RtspSessionsResponse =
  | RtspSession[]
  | { value?: RtspSession[]; sessions?: RtspSession[]; Count?: number };

// Field names are unconfirmed (untyped in the backend's own OpenAPI spec) —
// callers currently probe several possible keys defensively.
export interface RtspStatus {
  fire_detected?: boolean;
  fire?: boolean;
  smoke_detected?: boolean;
  smoke?: boolean;
  detected?: boolean;
  [key: string]: unknown;
}

/** POST /api/v1/rtsp/start → { job_id, ... } */
export const startFireRtsp = (
  rtsp_url: string,
  name?: string,
): Promise<RtspStartResponse> =>
  apiPost("/api/v1/rtsp/start", { rtsp_url, name }, FIRE_URL);

/** MJPEG stream URL — use as <img src={getFireRtspStreamUrl(job_id)}> */
export const getFireRtspStreamUrl = (job_id: string): string =>
  `${FIRE_URL}/api/v1/rtsp/stream/${job_id}`;

/** GET /api/v1/rtsp/status/{job_id} */
export const getFireRtspStatus = (job_id: string): Promise<RtspStatus> =>
  apiGet(`/api/v1/rtsp/status/${job_id}`, FIRE_URL);

/** GET /api/v1/rtsp/sessions → all active sessions on the backend */
export const listFireRtspSessions = (): Promise<RtspSessionsResponse> =>
  apiGet("/api/v1/rtsp/sessions", FIRE_URL);

/** POST /api/v1/rtsp/stop-alert/{job_id} — silence siren, re-arms in 5s if fire persists */
export const stopFireRtspAlert = (job_id: string): Promise<unknown> =>
  apiPost(`/api/v1/rtsp/stop-alert/${job_id}`, null, FIRE_URL);

/** POST /api/v1/rtsp/stop/{job_id} — end the detection session */
export const stopFireRtspSession = (job_id: string): Promise<unknown> =>
  apiPost(`/api/v1/rtsp/stop/${job_id}`, null, FIRE_URL);
