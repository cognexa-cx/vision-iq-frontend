
export interface Alert {
  id: string | number;
  camera_id?: string | number;
  camId?: string | number;
  acknowledged?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface GetAlertsParams {
  camera_id?: string | number;
  acknowledged?: boolean;
  limit?: number;
  skip?: number;
}

/**
 * NOT a real backend endpoint today — the Main Backend has no /alerts route
 * (confirmed 404 against the live server). Short-circuits to an empty list
 * instead of polling a route that will never exist until the backend adds
 * one, so callers don't spam the console every poll cycle.
 */
export const getAlerts = (_params: GetAlertsParams = {}): Promise<Alert[]> =>
  Promise.resolve([]);

/** Not available until the backend adds an alerts endpoint — no-op for now. */
export const acknowledgeAlert = (_alertId: string | number): Promise<Alert> =>
  Promise.resolve({} as Alert);
