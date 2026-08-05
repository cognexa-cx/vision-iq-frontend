import { apiGet, RAILWAY_URL } from "./client";

export const getRailwayHealth = (): Promise<unknown> =>
  apiGet("/health", RAILWAY_URL);

export const getBarrierState = (): Promise<unknown> =>
  apiGet("/api/barrier/state", RAILWAY_URL);

export const getBarrierAlerts = (limit: number = 100): Promise<unknown[]> =>
  apiGet(`/api/barrier/alerts?limit=${limit}`, RAILWAY_URL);
