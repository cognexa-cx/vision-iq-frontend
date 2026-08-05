import { apiGet, apiPut } from "./client";

export interface ZonePolygon {
  points: { x: number; y: number }[];
  [key: string]: unknown;
}

export interface Zone {
  camera_id: string | number;
  zones: ZonePolygon[];
  [key: string]: unknown;
}

/** GET /api/zones → Zone[] */
export const getZones = (): Promise<Zone[]> => apiGet("/api/zones");

/**
 * PUT /api/zones/{cameraId} → ZoneSet
 * body: ZoneSet — polygon definitions for detection zones
 */
export const updateZones = (
  cameraId: string | number,
  body: Partial<Zone>,
): Promise<Zone> => apiPut(`/api/zones/${cameraId}`, body);
