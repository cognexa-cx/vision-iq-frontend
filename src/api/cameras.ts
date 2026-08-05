import {
  apiGet,
  apiPost,
  apiPostFormWithProgress,
  apiPut,
  apiDelete,
  BASE_URL,
} from "./client";
import type {
  Camera,
  CameraCreate,
  CameraUpdate,
  CameraClone,
  CameraCloneCreate,
} from "../types/camera";

// ─── Camera CRUD ──────────────────────────────────────────────────────────────
// Matches the real Main Backend spec ("RTSP Camera Ingestion, Cloning &
// Analytics Bridge" @ 192.168.10.245:8000/docs). There is no start/stop,
// status, snapshot, or stream endpoint on this backend today — cameras run
// continuously once created, and "enabled" (via PUT) is the only lifecycle
// toggle it exposes.

/** GET /cameras → Camera[] */
export const getCameras = (): Promise<Camera[]> => apiGet("/cameras");

/** GET /cameras/{id} → Camera */
export const getCamera = (id: string): Promise<Camera> =>
  apiGet(`/cameras/${id}`);

/** POST /cameras → Camera */
export const createCamera = (body: CameraCreate): Promise<Camera> =>
  apiPost("/cameras", body);

/**
 * POST /cameras/upload → Camera
 * Uploads a video file and registers it as a camera source (loops/decodes
 * the file the same way an RTSP camera would), instead of pointing at a
 * live RTSP stream. Reports real upload progress (0-100) — video files can
 * be large enough that a silent multi-minute wait looks broken/stuck.
 */
export const uploadCameraVideo = (
  file: File,
  name?: string,
  target_fps?: number,
  onProgress?: (pct: number) => void,
): Promise<Camera> => {
  const form = new FormData();
  form.append("file", file);
  if (name) form.append("name", name);
  if (target_fps != null) form.append("target_fps", String(target_fps));
  return apiPostFormWithProgress(
    "/cameras/upload",
    form,
    onProgress ?? (() => {}),
  );
};

/** PUT /cameras/{id} → Camera */
export const updateCamera = (
  id: string,
  body: CameraUpdate,
): Promise<Camera> => apiPut(`/cameras/${id}`, body);

/** DELETE /cameras/{id} */
export const deleteCamera = (id: string): Promise<unknown> =>
  apiDelete(`/cameras/${id}`);

// ─── Camera lifecycle (only "enabled" toggle exists) ──────────────────────────

/** PUT /cameras/{id} {enabled:true} */
export const enableCamera = (id: string): Promise<Camera> =>
  updateCamera(id, { enabled: true });

/** PUT /cameras/{id} {enabled:false} */
export const disableCamera = (id: string): Promise<Camera> =>
  updateCamera(id, { enabled: false });

/** GET /cameras/{id}/health */
export const getCameraHealth = (id: string): Promise<unknown> =>
  apiGet(`/cameras/${id}/health`);

/** GET /cameras/{id}/channels → active analytics channel names, e.g. ["fire"] */
export const getCameraChannels = (id: string): Promise<string[]> =>
  apiGet(`/cameras/${id}/channels`);

// ─── Clones under cameras ─────────────────────────────────────────────────────

/** GET /cameras/{cameraId}/clones → CameraClone[] */
export const getCameraClones = (cameraId: string): Promise<CameraClone[]> =>
  apiGet(`/cameras/${cameraId}/clones`);

/** POST /cameras/{cameraId}/clones → CameraClone */
export const createCameraClone = (
  cameraId: string,
  body: CameraCloneCreate,
): Promise<CameraClone> => apiPost(`/cameras/${cameraId}/clones`, body);

// ─── Media URLs ───────────────────────────────────────────────────────────────
/** MJPEG stream URL — use as <img src={getCameraStreamUrl(id)}> */
export const getCameraStreamUrl = (id: string): string =>
  `${BASE_URL}/cameras/${id}/stream`;

// Not confirmed live yet — kept as a URL builder so the UI degrades
// gracefully (image onerror/retry) if it 404s.
export const getCameraSnapshotUrl = (id: string): string =>
  `${BASE_URL}/cameras/${id}/snapshot`;
