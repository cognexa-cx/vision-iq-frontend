import {
  WS_CROWD_URL,
  WS_FALL_URL,
  WS_VEHICLE_URL,
  WS_RAILWAY_URL,
  FIRE_URL,
  ANIMAL_URL,
  PPE_URL,
} from "../api/client";

// Each mode maps to the analytics backend the Main backend should bridge to,
// via "ws_bridge" (Main backend streams frames over this websocket and reads
// detections back). Fire, PPE, and Animal are all confirmed working end to
// end against live test clones (bridge_connected: true, frames flowing).
// None of these websocket paths show up in each service's own OpenAPI spec
// since FastAPI doesn't list ws routes there. The rest are unconfirmed
// best-effort configs.
export function analyticsConfigFor(modeId: string): {
  analytics_protocol: "ws_bridge" | "rest_detect";
  analytics_ws_url: string | null;
} {
  switch (modeId) {
    case "fire":
      return {
        analytics_protocol: "ws_bridge",
        analytics_ws_url: `${FIRE_URL.replace(/^http/, "ws")}/api/v1/ws/analyze`,
      };
    case "ppe":
      return {
        analytics_protocol: "ws_bridge",
        analytics_ws_url: `${PPE_URL.replace(/^http/, "ws")}/ws/analyze`,
      };
    case "animal":
      return {
        analytics_protocol: "ws_bridge",
        analytics_ws_url: `${ANIMAL_URL.replace(/^http/, "ws")}/ws/analyze`,
      };
    case "crowd":
      return {
        analytics_protocol: "ws_bridge",
        analytics_ws_url: `${WS_CROWD_URL}/ws/analyze`,
      };
    case "fall":
      return {
        analytics_protocol: "ws_bridge",
        analytics_ws_url: `${WS_FALL_URL}/ws/analyze`,
      };
    case "vehicle":
      return { analytics_protocol: "ws_bridge", analytics_ws_url: WS_VEHICLE_URL };
    case "railway":
      return { analytics_protocol: "ws_bridge", analytics_ws_url: WS_RAILWAY_URL };
    default:
      return { analytics_protocol: "ws_bridge", analytics_ws_url: null };
  }
}
