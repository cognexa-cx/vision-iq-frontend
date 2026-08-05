// ─── Base URLs ────────────────────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.10.20:8003"; // Main backend
const FALL_URL = import.meta.env.VITE_FALL_URL || "http://localhost:9001"; // Fall    :9001
const VEHICLE_URL =
  import.meta.env.VITE_VEHICLE_URL || "http://localhost:9002"; // Vehicle :9002
const RAILWAY_URL =
  import.meta.env.VITE_RAILWAY_URL || "http://localhost:9003"; // Railway :9003
const ANIMAL_URL =
  import.meta.env.VITE_ANIMAL_URL || "http://192.168.10.20:8002"; // Animal backend
const CROWD_URL =
  import.meta.env.VITE_CROWD_API_BASE_URL || "http://localhost:9005"; // Crowd :9005
const FIRE_URL =
  import.meta.env.VITE_FIRE_URL || "http://192.168.10.20:8001"; // Fire (RTSP microservice)
const PPE_URL = import.meta.env.VITE_PPE_URL || "http://192.168.10.20:8000"; // PPE backend
// New unified backend — replaces the old Main/Fire/PPE/Animal multi-service
// setup with a single service (streams + pluggable detection modules).
const VISION_URL =
  import.meta.env.VITE_VISION_URL || "http://192.168.10.20:8000";

// ─── WebSocket URLs ───────────────────────────────────────────────────────────
const WS_URL = import.meta.env.VITE_WS_URL || BASE_URL.replace(/^http/, "ws");
const WS_FALL_URL =
  import.meta.env.VITE_WS_FALL_URL || FALL_URL.replace(/^http/, "ws");
const WS_VEHICLE_URL =
  import.meta.env.VITE_WS_VEHICLE_URL || VEHICLE_URL.replace(/^http/, "ws");
const WS_RAILWAY_URL =
  import.meta.env.VITE_WS_RAILWAY_URL || RAILWAY_URL.replace(/^http/, "ws");
const WS_ANIMAL_URL =
  import.meta.env.VITE_WS_ANIMAL_URL || ANIMAL_URL.replace(/^http/, "ws");
const WS_CROWD_URL = CROWD_URL.replace(/^http/, "ws");
const WS_VISION_URL =
  import.meta.env.VITE_WS_VISION_URL || VISION_URL.replace(/^http/, "ws");
// Confirmed live: ws://<host>/ws/stream/{stream_id} pushes raw JPEG frames
// (each message starts with the FFD8FF SOI marker, ends FFD9 EOI) — no
// msgpack/custom framing needed, unlike the old backend's websocket.
export function getVisionStreamWsUrl(streamId: string): string {
  return `${WS_VISION_URL}/ws/stream/${encodeURIComponent(streamId)}`;
}

export {
  BASE_URL,
  FALL_URL,
  VEHICLE_URL,
  RAILWAY_URL,
  ANIMAL_URL,
  CROWD_URL,
  FIRE_URL,
  PPE_URL,
  VISION_URL,
  WS_URL,
  WS_FALL_URL,
  WS_VEHICLE_URL,
  WS_RAILWAY_URL,
  WS_ANIMAL_URL,
  WS_CROWD_URL,
  WS_VISION_URL,
};

// ─── Default headers ──────────────────────────────────────────────────────────
const defaultHeaders = {
  "ngrok-skip-browser-warning": "true",
  "Content-Type": "application/json",
};

// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status === 422 || res.status === 404;
  } catch {
    return false;
  }
}

// ─── Generic helpers (accept any base) ───────────────────────────────────────
export async function apiGet<T = any>(
  endpoint: string,
  base: string = BASE_URL,
): Promise<T> {
  const res = await fetch(`${base}${endpoint}`, {
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

interface ValidationErrorDetail {
  loc?: (string | number)[];
  msg: string;
}

export async function apiPost<T = any>(
  endpoint: string,
  body: unknown = null,
  base: string = BASE_URL,
): Promise<T> {
  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `POST ${endpoint} failed: ${res.status}`;
    try {
      const err = await res.json();
      if (err?.detail) {
        detail = Array.isArray(err.detail)
          ? err.detail
              .map(
                (d: ValidationErrorDetail) =>
                  `${d.loc?.join(".")} — ${d.msg}`,
              )
              .join(", ")
          : err.detail;
      }
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

export async function apiPut<T = any>(
  endpoint: string,
  body: unknown = null,
  base: string = BASE_URL,
): Promise<T> {
  const res = await fetch(`${base}${endpoint}`, {
    method: "PUT",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPatch<T = any>(
  endpoint: string,
  body: unknown = null,
  base: string = BASE_URL,
): Promise<T> {
  const res = await fetch(`${base}${endpoint}`, {
    method: "PATCH",
    headers: defaultHeaders,
    body: body !== null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PATCH ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ─── DELETE: handles 204 No Content safely ────────────────────────────────────
export async function apiDelete<T = any>(
  endpoint: string,
  base: string = BASE_URL,
): Promise<T | null> {
  const res = await fetch(`${base}${endpoint}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
  if (res.status === 204 || res.headers.get("content-length") === "0")
    return null;
  return res.json().catch(() => null);
}

export async function apiPostForm<T = any>(
  endpoint: string,
  formData: FormData,
  base: string = BASE_URL,
): Promise<T> {
  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: { "ngrok-skip-browser-warning": "true" },
    body: formData,
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}

/**
 * Same as apiPostForm, but for large file uploads where the caller needs
 * real progress feedback — `fetch` has no upload-progress event at all, so a
 * big video upload just looks frozen with no signal it's actually working.
 * Uses XMLHttpRequest (the only web API that exposes upload progress) and a
 * generous but finite timeout so a truly stalled upload fails loudly instead
 * of hanging forever.
 */
export function apiPostFormWithProgress<T = any>(
  endpoint: string,
  formData: FormData,
  onProgress: (pct: number) => void,
  base: string = BASE_URL,
  timeoutMs: number = 5 * 60 * 1000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}${endpoint}`);
    xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
    xhr.timeout = timeoutMs;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Upload succeeded but response wasn't valid JSON."));
        }
      } else {
        let detail = `POST ${endpoint} failed: ${xhr.status}`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.detail) detail = err.detail;
        } catch {}
        reject(new Error(detail));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed — network error."));
    xhr.ontimeout = () =>
      reject(new Error("Upload timed out — the file may be too large or the connection too slow."));

    xhr.send(formData);
  });
}
