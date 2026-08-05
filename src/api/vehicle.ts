import { apiGet, VEHICLE_URL } from "./client";

export const getVehicleHealth = (): Promise<unknown> =>
  apiGet("/health", VEHICLE_URL);

export const getVehicleCameras = (): Promise<unknown[]> =>
  apiGet("/cameras", VEHICLE_URL);

export const getVehicleActivity = (limit: number = 20): Promise<unknown[]> =>
  apiGet(`/dashboard?type=activity&limit=${limit}`, VEHICLE_URL);
