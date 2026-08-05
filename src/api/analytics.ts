import { apiGet } from "./client";

export interface AnalyticsQueryParams {
  camera_id?: string | number;
  metric?: string;
  interval?: string;
  start?: string;
  end?: string;
  mode?: string;
}

function buildQuery(params: AnalyticsQueryParams): string {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    ),
  ).toString();
  return q ? `?${q}` : "";
}

/**
 * GET /api/analytics/summary → summary object
 * Expected shape (adapt to actual API response):
 * {
 *   total_cameras, active_cameras,
 *   total_alerts, critical_alerts,
 *   people_today, vehicles_today,
 *   events_today
 * }
 */
export const getAnalyticsSummary = (
  params: AnalyticsQueryParams = {},
): Promise<Record<string, unknown>> =>
  apiGet(`/api/analytics/summary${buildQuery(params)}`);

/**
 * GET /api/analytics/timeseries → timeseries data
 * Expected shape: { labels: string[], datasets: { label, data }[] }
 * or array of { date, value } — adapt in useAnalytics hook.
 */
export const getAnalyticsTimeseries = (
  params: AnalyticsQueryParams = {},
): Promise<unknown> =>
  apiGet(`/api/analytics/timeseries${buildQuery(params)}`);

/** GET /api/analytics/ai → AI-generated analytics */
export const getAIAnalytics = (
  params: AnalyticsQueryParams = {},
): Promise<unknown> => apiGet(`/api/analytics/ai${buildQuery(params)}`);
