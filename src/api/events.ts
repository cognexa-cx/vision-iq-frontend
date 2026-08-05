import { apiGet, BASE_URL } from "./client";

export interface DetectionEvent {
  id: string | number;
  camera_id?: string | number;
  type?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface GetEventsParams {
  camera_id?: string | number;
  type?: string;
  limit?: number;
  skip?: number;
  start?: string;
  end?: string;
}

/**
 * GET /api/events → Event[]
 * Optional query params: camera_id, type, limit, skip, start, end
 */
export const getEvents = (
  params: GetEventsParams = {},
): Promise<DetectionEvent[]> => {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    ),
  ).toString();
  return apiGet(`/api/events${q ? `?${q}` : ""}`);
};

/** GET /api/events/{id} → Event */
export const getEvent = (id: string | number): Promise<DetectionEvent> =>
  apiGet(`/api/events/${id}`);

/** Event snapshot image URL — use as <img src={getEventSnapshotUrl(id)}> */
export const getEventSnapshotUrl = (id: string | number): string =>
  `${BASE_URL}/api/events/${id}/snapshot`;
