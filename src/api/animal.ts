import { apiGet, apiPost, ANIMAL_URL } from "./client";

// ─── Animal Detection — RTSP live camera ─────────────────────────────────────
// Standalone microservice (VITE_ANIMAL_URL). Sessions are keyed by
// session_id, independent of the Main backend's camera/clone registry —
// mirrors the Fire microservice's job_id pattern (see api/fire.ts), except
// detections stream over the returned websocket_url instead of MJPEG.

export type AnimalSessionStatus = "starting" | "running" | "stopped";

export interface StartAnimalSessionResponse {
  session_id: string;
  source_type: "rtsp" | "video_file";
  status: AnimalSessionStatus;
  websocket_url: string;
}

export interface AnimalSessionStatusResponse {
  session_id: string;
  source_type: "rtsp" | "video_file";
  status: AnimalSessionStatus;
  connected_clients: number;
  last_detection_at?: number | null;
}

/** POST /sessions/rtsp → { session_id, websocket_url, ... } */
export const startAnimalRtspSession = (
  rtsp_url: string,
): Promise<StartAnimalSessionResponse> =>
  apiPost("/sessions/rtsp", { rtsp_url }, ANIMAL_URL);

/** GET /sessions/{session_id} */
export const getAnimalSessionStatus = (
  sessionId: string,
): Promise<AnimalSessionStatusResponse> =>
  apiGet(`/sessions/${sessionId}`, ANIMAL_URL);

/** POST /sessions/{session_id}/stop */
export const stopAnimalSession = (sessionId: string): Promise<unknown> =>
  apiPost(`/sessions/${sessionId}/stop`, null, ANIMAL_URL);

/** GET /health */
export const getAnimalHealth = (): Promise<unknown> =>
  apiGet("/health", ANIMAL_URL);

/** Resolve a websocket_url returned by the backend into an absolute ws:// URL. */
export const resolveAnimalWebsocketUrl = (websocket_url: string): string =>
  websocket_url.startsWith("ws")
    ? websocket_url
    : `${ANIMAL_URL.replace(/^http/, "ws")}${websocket_url}`;
