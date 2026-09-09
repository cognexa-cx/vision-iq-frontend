// src/data/logsData.ts
export type LogStatus = "Success" | "Failed" | "Warning";
export type LogCategory = "Systems" | "Detection" | "Error" | "User Activity";

export interface LogEntry {
  id: string;
  time: string; // ISO
  eventType: string;
  description: string;
  status: LogStatus;
  category: LogCategory;
}

export const LOG_CATEGORIES: LogCategory[] = ["Systems", "Detection", "Error", "User Activity"];

export const STATUS_COLORS: Record<LogStatus, { bg: string; text: string }> = {
  Success: { bg: "#DCFCE7", text: "#166534" },
  Failed: { bg: "#FEE2E2", text: "#B91C1C" },
  Warning: { bg: "#FFEDD5", text: "#C2410C" },
};

// No backend concept of user accounts/sessions exists anywhere in this app
// (Navbar's "Admin" identity is a static placeholder, confirmed elsewhere in
// the codebase) — so unlike Systems/Detection/Error below, User Activity has
// no real data source at all and is sample-only.
export const DUMMY_USER_ACTIVITY_LOGS: LogEntry[] = [
  { id: "ua-1", time: "2026-09-07T09:12:00", eventType: "Login", description: "Admin signed in from 192.168.10.24", status: "Success", category: "User Activity" },
  { id: "ua-2", time: "2026-09-07T09:20:00", eventType: "Settings Change", description: "Notification preferences updated", status: "Success", category: "User Activity" },
  { id: "ua-3", time: "2026-09-06T17:45:00", eventType: "Login", description: "Failed login attempt (wrong password)", status: "Failed", category: "User Activity" },
  { id: "ua-4", time: "2026-09-06T14:02:00", eventType: "Camera Master", description: "Detection quota changed for Main Gate", status: "Success", category: "User Activity" },
];

// Fallback Systems/Error entries shown only while the backend is unreachable
// — real ones are derived from live camera data in logsHelpers.ts.
export const DUMMY_SYSTEM_LOGS: LogEntry[] = [
  { id: "sys-1", time: "2026-09-07T01:00:00", eventType: "Camera Registered", description: "Main Gate added to the system", status: "Success", category: "Systems" },
  { id: "sys-2", time: "2026-09-06T22:30:00", eventType: "Camera Disabled", description: "Rooftop disabled", status: "Warning", category: "Systems" },
];

export const DUMMY_ERROR_LOGS: LogEntry[] = [
  { id: "err-1", time: "2026-09-06T20:15:00", eventType: "Camera Error", description: "Parking Lot: connection lost — reconnecting", status: "Failed", category: "Error" },
];
