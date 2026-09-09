// src/data/eventsData.ts
// Sample events shown when the real backend is unreachable, so the Events
// page still looks presentable instead of a bare error screen — matches the
// Figma mock rows (Animal Detection, Zone 01, Camera 0000000 000000, etc.)
// but varied across types/zones/cameras for a more realistic demo.
import type { DetectionEvent } from "../api/events";

/** Extra demo-only fields shown in the details modal — not part of the real
 *  API contract, so all optional. Real events just render "—" for these. */
export interface EventRecord extends DetectionEvent {
  location?: string;
  status?: string;
  confidence?: number;
  duration_sec?: number;
  camera_type?: string;
  resolution?: string;
  recording_id?: string;
  response_time_sec?: number;
  detection_model?: string;
  device_ip?: string;
  gps?: string;
  power_status?: string;
  weather?: string;
  operator?: string;
  notes?: string;
}

const DUMMY_TYPES = ["animal", "fall", "intrusion", "vehicle"];
const DUMMY_SEVERITIES = ["medium", "high", "low", "critical"];
const DUMMY_STATUSES = ["New", "Acknowledged", "Resolved", "Escalated"];
const DUMMY_LOCATIONS = ["Main Gate", "Warehouse B", "Parking Lot", "Perimeter Fence", "Loading Dock", "Rooftop"];
const DUMMY_OPERATORS = ["A. Sharma", "R. Iyer", "S. Khan", "M. Patel"];
const DUMMY_CAMERA_TYPES = ["PTZ Dome", "Fixed Bullet", "Thermal", "PTZ Bullet"];
const DUMMY_MODELS = ["YOLOv8-detect-v3", "VisionIQ-Core-v2.1", "EdgeNet-Lite"];
const DUMMY_WEATHER = ["Clear", "Cloudy", "Light Rain", "Foggy", "Night/IR"];

export const DUMMY_EVENTS: EventRecord[] = Array.from({ length: 40 }, (_, i) => ({
  id: `dummy-${i}`,
  camera_id: `0000000 0000${String(i % 8).padStart(2, "0")}`,
  type: DUMMY_TYPES[i % DUMMY_TYPES.length],
  severity: DUMMY_SEVERITIES[i % DUMMY_SEVERITIES.length],
  created_at: new Date(new Date(2026, 8, 7, 1, 0).getTime() - i * 3_600_000).toISOString(),
  zone_no: String((i % 6) + 1).padStart(2, "0"),
  snapshot_path: null,
  // ── extra demo-only fields shown in the details modal ──
  location: DUMMY_LOCATIONS[i % DUMMY_LOCATIONS.length],
  status: DUMMY_STATUSES[i % DUMMY_STATUSES.length],
  confidence: 82 + (i % 17),
  duration_sec: 4 + (i % 12),
  camera_type: DUMMY_CAMERA_TYPES[i % DUMMY_CAMERA_TYPES.length],
  resolution: i % 2 === 0 ? "1920x1080" : "2560x1440",
  recording_id: `REC-${2026000 + i}`,
  response_time_sec: 8 + (i % 20),
  detection_model: DUMMY_MODELS[i % DUMMY_MODELS.length],
  device_ip: `192.168.10.${20 + (i % 30)}`,
  gps: "12.9716° N, 77.5946° E",
  power_status: i % 5 === 0 ? "Battery" : "Mains",
  weather: DUMMY_WEATHER[i % DUMMY_WEATHER.length],
  operator: DUMMY_OPERATORS[i % DUMMY_OPERATORS.length],
  notes: "Auto-flagged by detection pipeline; pending review.",
}));

export const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "Custom", value: "custom" },
];

// Base set of known alert types — EventsPage merges this with whatever
// types actually show up in the live data, so a real event of an unlisted
// type is still filterable instead of silently missing from the dropdown.
export const BASE_EVENT_TYPES = ["fall", "animal", "intrusion", "vehicle"];
export const SEVERITY_OPTIONS = ["all", "critical", "high", "medium", "low"];

export const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#FEE2E2", text: "#B91C1C" },
  high: { bg: "#FFEDD5", text: "#C2410C" },
  medium: { bg: "#F4EEFF", text: "#3D0C92" },
  low: { bg: "#DCFCE7", text: "#166534" },
};

export const EVENTS_PER_PAGE = 20;
