import { apiGet } from "./client";

/** GET /api/health → { status: "ok" } */
export const getHealth = (): Promise<{ status: string }> =>
  apiGet("/api/health");

/** GET /api/config → runtime configuration object */
export const getConfig = (): Promise<Record<string, unknown>> =>
  apiGet("/api/config");
