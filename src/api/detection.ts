import {
  apiGet,
  FALL_URL,
  ANIMAL_URL,
  VEHICLE_URL,
  RAILWAY_URL,
} from "./client";

export type DetectionMode = "fall" | "animal" | "vehicle" | "railway";

interface DetectionConfig {
  base: string;
  endpoint: (limit: number) => string;
}

// Maps clone mode → base URL + events endpoint
const DETECTION_CONFIG: Record<DetectionMode, DetectionConfig> = {
  fall: { base: FALL_URL, endpoint: (n) => `/events?limit=${n}` },
  animal: {
    base: ANIMAL_URL,
    endpoint: (n) => `/api/animal/alerts?limit=${n}`,
  },
  vehicle: {
    base: VEHICLE_URL,
    endpoint: (n) => `/dashboard?type=activity&limit=${n}`,
  },
  railway: {
    base: RAILWAY_URL,
    endpoint: (n) => `/api/barrier/alerts?limit=${n}`,
  },
};

export function hasDetectionBackend(mode: string): mode is DetectionMode {
  return Object.prototype.hasOwnProperty.call(DETECTION_CONFIG, mode);
}

export async function fetchDetectionEvents(
  mode: string,
  limit: number = 20,
): Promise<unknown[]> {
  if (!hasDetectionBackend(mode)) return [];
  const config = DETECTION_CONFIG[mode];
  try {
    const data = await apiGet(config.endpoint(limit), config.base);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
