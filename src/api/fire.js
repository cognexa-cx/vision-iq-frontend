import { apiGet, apiPost, FIRE_URL } from "./client";

// ─── Fire & Smoke Detection — RTSP live camera ───────────────────────────────
// Standalone microservice (VITE_FIRE_URL). Sessions are keyed by job_id,
// independent of the Main backend's camera/clone registry.

/** POST /api/v1/rtsp/start → { job_id, ... } */
export const startFireRtsp = (rtsp_url, name) =>
  apiPost("/api/v1/rtsp/start", { rtsp_url, name }, FIRE_URL);

/** MJPEG stream URL — use as <img src={getFireRtspStreamUrl(job_id)}> */
export const getFireRtspStreamUrl = (job_id) =>
  `${FIRE_URL}/api/v1/rtsp/stream/${job_id}`;

/** GET /api/v1/rtsp/status/{job_id} */
export const getFireRtspStatus = (job_id) =>
  apiGet(`/api/v1/rtsp/status/${job_id}`, FIRE_URL);

/** GET /api/v1/rtsp/sessions → all active sessions on the backend */
export const listFireRtspSessions = () =>
  apiGet("/api/v1/rtsp/sessions", FIRE_URL);

/** POST /api/v1/rtsp/stop-alert/{job_id} — silence siren, re-arms in 5s if fire persists */
export const stopFireRtspAlert = (job_id) =>
  apiPost(`/api/v1/rtsp/stop-alert/${job_id}`, null, FIRE_URL);

/** POST /api/v1/rtsp/stop/{job_id} — end the detection session */
export const stopFireRtspSession = (job_id) =>
  apiPost(`/api/v1/rtsp/stop/${job_id}`, null, FIRE_URL);
