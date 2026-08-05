import { apiGet, apiPatch, apiDelete, BASE_URL } from "./client";
import type { CameraClone, CameraCloneUpdate } from "../types/camera";

// ─── Clone CRUD ───────────────────────────────────────────────────────────────
// Matches the real Main Backend spec. Clones are camera → analytics-backend
// bindings; there is no start/stop/status/snapshot/stream endpoint for them —
// "enabled" (via PATCH) is the only lifecycle toggle.

/** GET /clones → CameraClone[] */
export const getClones = (): Promise<CameraClone[]> => apiGet("/clones");

/** GET /clones/{id} → CameraClone */
export const getClone = (id: string): Promise<CameraClone> =>
  apiGet(`/clones/${id}`);

/** PATCH /clones/{id} → CameraClone */
export const updateClone = (
  id: string,
  body: CameraCloneUpdate,
): Promise<CameraClone> => apiPatch(`/clones/${id}`, body);

/** DELETE /clones/{id} */
export const deleteClone = (id: string): Promise<unknown> =>
  apiDelete(`/clones/${id}`);

// The real GET /clones/{id} response's `status` field is a runtime object
// (bridge_connected, frames_sent, latest_boxes, ...), not the client-side
// derived "running"/"stopped" string useClones.ts assigns to the same field
// name for polled list state — this is that real shape.
export interface CloneRuntimeStatus {
  bridge_connected?: boolean;
  frames_sent?: number;
  frames_received?: number;
  fps?: number;
  last_error?: string | null;
  latest_boxes?: unknown[];
}

/**
 * NOT a real backend endpoint — the real spec has no per-clone
 * latest_payload. This shims callers that expect one (crowd panels, etc.)
 * by reading the clone record itself; `latest_payload` is always null until
 * the backend actually exposes detection payloads per clone.
 */
export const getCloneStatus = async (
  id: string,
): Promise<
  Omit<CameraClone, "status"> & {
    running: boolean;
    status?: CloneRuntimeStatus;
  }
> => {
  const clone = await getClone(id);
  return {
    ...clone,
    status: clone.status as unknown as CloneRuntimeStatus,
    running: !!clone.enabled,
    latest_payload: null,
  };
};

// ─── Clone lifecycle (only "enabled" toggle exists) ───────────────────────────

/** PATCH /clones/{id} {enabled:true} */
export const enableClone = (id: string): Promise<CameraClone> =>
  updateClone(id, { enabled: true });

/** PATCH /clones/{id} {enabled:false} */
export const disableClone = (id: string): Promise<CameraClone> =>
  updateClone(id, { enabled: false });

// ─── Media URLs ───────────────────────────────────────────────────────────────
/** MJPEG stream URL — use as <img src={getCloneStreamUrl(id)}> */
export const getCloneStreamUrl = (id: string): string =>
  `${BASE_URL}/clones/${id}/stream`;

// Not confirmed live yet — kept as a URL builder so the UI degrades
// gracefully (image onerror/retry) if it 404s.
export const getCloneSnapshotUrl = (id: string): string =>
  `${BASE_URL}/clones/${id}/snapshot`;
