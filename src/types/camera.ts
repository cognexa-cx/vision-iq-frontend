// Shared Main-backend domain types.
// Mirrors the real Main Backend OpenAPI spec ("RTSP Camera Ingestion,
// Cloning & Analytics Bridge" @ 192.168.10.245:8000/docs).

export type Transport = "tcp" | "udp";
export type HwAccel = "none" | "nvdec" | "vaapi" | "qsv";
export type AnalyticsProtocol = "ws_bridge" | "rest_detect";

export interface CameraStatus {
  connected?: boolean;
  current_fps?: number;
  bitrate_kbps?: number;
  width?: number | null;
  height?: number | null;
  decode_latency_ms?: number | null;
  reconnect_count?: number;
  dropped_frames?: number;
  subscriber_count?: number;
  last_frame_ts?: string | null;
  last_error?: string | null;
}

export interface Camera {
  id: string;
  name: string;
  rtsp_url: string;
  transport?: Transport;
  profile?: string;
  target_fps?: number | null;
  hw_accel?: HwAccel;
  enabled?: boolean;
  tags?: string[];
  created_at?: string;
  status?: CameraStatus;
  // client-side only (derived, not from the API) — kept for UI convenience
  running?: boolean;
}

export interface CameraCreate {
  name: string;
  rtsp_url: string;
  transport?: Transport;
  profile?: string;
  target_fps?: number | null;
  hw_accel?: HwAccel;
  enabled?: boolean;
  tags?: string[];
}

export type CameraUpdate = Partial<CameraCreate>;

export interface CameraClone {
  id: string;
  name?: string | null;
  camera_id?: string;
  analytics_ws_url?: string | null;
  analytics_protocol?: AnalyticsProtocol;
  analytics_detect_path?: string;
  enabled?: boolean;
  created_at?: string;
  // client-side only — inferred detection mode ("fire", "animal", ...)
  mode?: string;
  running?: boolean;
  status?: "running" | "stopped" | string;
  latest_payload?: {
    image?: string;
    crowd_alert?: {
      person_count?: number;
      crowd_limit?: number;
      confirmed?: boolean;
      active?: boolean;
    };
    [key: string]: unknown;
  } | null;
}

export interface CameraCloneCreate {
  name?: string | null;
  analytics_ws_url?: string | null;
  analytics_protocol?: AnalyticsProtocol;
  analytics_detect_path?: string;
  // client-side only — which detection model this clone represents
  mode?: string;
}

export type CameraCloneUpdate = Partial<CameraCloneCreate> & {
  enabled?: boolean;
};
