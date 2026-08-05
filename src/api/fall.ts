import { apiGet, FALL_URL } from "./client";

export const getFallHealth = (): Promise<unknown> =>
  apiGet("/health", FALL_URL);

export const getFallCameras = (): Promise<unknown[]> =>
  apiGet("/cameras", FALL_URL);

export const getFallEvents = (limit: number = 20): Promise<unknown[]> =>
  apiGet(`/events?limit=${limit}`, FALL_URL);
