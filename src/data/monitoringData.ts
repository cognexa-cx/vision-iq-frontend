// src/data/monitoringData.ts
// Sample zones shown when the real backend has none registered yet, so the
// Monitoring page still looks presentable — matches the Figma mock's zone
// count (Zone 01..Zone 09) without repeating the same label like the raw
// design mock did.
export interface ZoneCamera {
  id: string | number;
  name?: string;
  enabled?: boolean;
}

export interface ZoneRecord {
  id: string;
  label: string;
  cameras: ZoneCamera[];
}

export const DUMMY_ZONE_COUNT = 9;
const DUMMY_CAMS_PER_ZONE = [2, 3, 1, 4, 2, 3, 1, 2, 3];

export const DUMMY_ZONES: ZoneRecord[] = Array.from({ length: DUMMY_ZONE_COUNT }, (_, i) => {
  const zoneNo = String(i + 1).padStart(2, "0");
  const camCount = DUMMY_CAMS_PER_ZONE[i % DUMMY_CAMS_PER_ZONE.length];
  return {
    id: `dummy-zone-${i + 1}`,
    label: `Zone ${zoneNo}`,
    cameras: Array.from({ length: camCount }, (_, j) => ({
      id: `dummy-cam-${i + 1}-${j + 1}`,
      name: `CAM-${zoneNo}-${j + 1}`,
      enabled: (i + j) % 5 !== 4,
    })),
  };
});

export const DUMMY_TOTAL_CAMERAS = 24;
