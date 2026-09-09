// src/data/cameraMasterData.ts
import type { Camera } from "../types/camera";

export interface DetectionTypeConfig {
  key: string;
  label: string;
  max: number;
}

// No subscription/quota API exists on the backend today — these limits are a
// client-side plan configuration (matches the Figma mock's "(10)" per
// column), enforced here so the page behaves like a real seat-limited
// subscription rather than a decorative table.
export const DETECTION_TYPES: DetectionTypeConfig[] = [
  { key: "animal_detection", label: "Animal Detection", max: 10 },
  { key: "crowd_detection", label: "Crowd Detection", max: 10 },
  { key: "intruder_detection", label: "Intruder Detection", max: 10 },
];

// Total camera seats on the plan — same placeholder-plan-limit idea as
// LicensePage's static "Seats: 10", just applied here to drive the real
// Total/Active/Remaining counts against actual camera data.
export const CAMERA_SEAT_LIMIT = 50;

export const CSV_TEMPLATE_HEADER = "name,rtsp_url";
export const CSV_TEMPLATE_EXAMPLE_ROW = "Gate Camera 01,rtsp://user:pass@192.168.1.10:554/stream1";

// Sample cameras shown when the backend is unreachable, so the page still
// looks presentable — varied names/tags instead of the raw Figma mock's
// repeated "CAM 01" placeholder in every row.
export const DUMMY_CAMERAS: Camera[] = [
  { id: "dummy-1", name: "Main Gate", rtsp_url: "rtsp://demo/main-gate", enabled: true, tags: ["animal_detection", "intruder_detection"] },
  { id: "dummy-2", name: "Warehouse B", rtsp_url: "rtsp://demo/warehouse-b", enabled: true, tags: ["crowd_detection"] },
  { id: "dummy-3", name: "Parking Lot", rtsp_url: "rtsp://demo/parking-lot", enabled: false, tags: [] },
  { id: "dummy-4", name: "Perimeter Fence", rtsp_url: "rtsp://demo/perimeter-fence", enabled: true, tags: ["intruder_detection"] },
  { id: "dummy-5", name: "Loading Dock", rtsp_url: "rtsp://demo/loading-dock", enabled: true, tags: ["animal_detection", "crowd_detection", "intruder_detection"] },
  { id: "dummy-6", name: "Rooftop", rtsp_url: "rtsp://demo/rooftop", enabled: false, tags: [] },
];
