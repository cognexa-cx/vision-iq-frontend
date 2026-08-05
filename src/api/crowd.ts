import { apiGet, apiPost, apiDelete, CROWD_URL } from "./client";

// ─── Crowd Detection Service (Port 9005) ─────────────────────────────────────

export interface CrowdCameraCreate {
  name: string;
  source: string;
  [key: string]: unknown;
}

/** GET /health → { status, crowd_limit, active_cameras, model_loaded, ... } */
export const getCrowdHealth = (): Promise<unknown> =>
  apiGet("/health", CROWD_URL);

/** GET /settings → full model / camera / crowd_detection settings */
export const getCrowdSettings = (): Promise<unknown> =>
  apiGet("/settings", CROWD_URL);

/** POST /settings → update settings */
export const updateCrowdSettings = (
  body: Record<string, unknown>,
): Promise<unknown> => apiPost("/settings", body, CROWD_URL);

/** GET /cameras → CameraInfo[] registered in crowd service */
export const getCrowdServiceCameras = (): Promise<unknown[]> =>
  apiGet("/cameras", CROWD_URL);

/** POST /cameras → add camera to crowd service */
export const addCrowdServiceCamera = (
  body: CrowdCameraCreate,
): Promise<unknown> => apiPost("/cameras", body, CROWD_URL);

/** POST /cameras/{id}/start */
export const startCrowdServiceCamera = (
  id: string | number,
): Promise<unknown> => apiPost(`/cameras/${id}/start`, null, CROWD_URL);

/** POST /cameras/{id}/stop */
export const stopCrowdServiceCamera = (
  id: string | number,
): Promise<unknown> => apiPost(`/cameras/${id}/stop`, null, CROWD_URL);

/** DELETE /cameras/{id} */
export const deleteCrowdServiceCamera = (
  id: string | number,
): Promise<unknown> => apiDelete(`/cameras/${id}`, CROWD_URL);

/** MJPEG stream URL — use directly as <img src> */
export const getCrowdServiceStreamUrl = (id: string | number): string =>
  `${CROWD_URL}/cameras/${id}/stream`;

/** GET /events → CrowdEventResponse[] */
export const getCrowdEvents = (): Promise<unknown[]> =>
  apiGet("/events", CROWD_URL);

/** GET /api/analytics/crowd */
export const getCrowdAnalytics = (): Promise<unknown> =>
  apiGet("/api/analytics/crowd", CROWD_URL);
