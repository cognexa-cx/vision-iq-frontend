import { useState, useEffect, useRef } from "react";
import { PPE_ITEMS } from "../data/mockData";
import { apiGet } from "../api/client";
import { getAnimalStatus } from "../api/animal";
import {
  getFireRtspStatus,
  listFireRtspSessions,
} from "../api/fire";

// Storage key must match useFireRtsp so both hooks share the same session.
const FIRE_RTSP_STORAGE_KEY = "fireRtspJobId";

// ─── useDetection ─────────────────────────────────────────────────────────────
// Polls /ppe/status every second for live PPE violation updates
export function useDetection(camera, streamActive = true) {
  const [violations, setViolations] = useState([]);
  const [muted, setMuted] = useState(false);
  const lastDetectedRef = useRef(false);

  useEffect(() => {
    if (!camera || !streamActive) {
      setViolations([]);
      return;
    }

    const VIOLATION_MAP = {
      "NO-Hardhat": "helmet",
      "NO-Safety Vest": "vest",
      "NO-Mask": "goggles",
      "NO-Safety Gloves": "hand_gloves",
      "NO-Gloves": "hand_gloves",
    };

    async function poll() {
      try {
        const res = await apiGet("/ppe/status");

        if (res.detected) {
          const uniqueViolations = [...new Set(res.violations ?? [])];
          const mappedIds = uniqueViolations
            .map((v) => VIOLATION_MAP[v])
            .filter(Boolean);
          setViolations(mappedIds);

          window.dispatchEvent(new CustomEvent("ppeDetected", { detail: res }));
          lastDetectedRef.current = true;
        } else {
          setViolations([]);
          if (lastDetectedRef.current) {
            window.dispatchEvent(
              new CustomEvent("ppeDetected", { detail: res }),
            );
            lastDetectedRef.current = false;
          }
        }
      } catch (_) {}
    }

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [camera?.id, streamActive]);

  return { violations, muted, setMuted };
}

// ─── useStats ────────────────────────────────────────────────────────────────
// Pass wsDetections when WS mode === "COUNTING" — polling is skipped automatically.
export function useStats(wsDetections = null) {
  const [stats, setStats] = useState({ in: 0, out: 0, total: 0, in_frame: 0 });

  // WS path — live data from WebSocket
  useEffect(() => {
    if (!wsDetections) return;
    setStats({
      in: wsDetections.in ?? 0,
      out: wsDetections.out ?? 0,
      total: wsDetections.total ?? 0,
      in_frame: wsDetections.in_frame ?? 0,
    });
  }, [wsDetections]);

  // Fallback polling — only runs when no WS data
  useEffect(() => {
    if (wsDetections !== null) return;

    async function poll() {
      try {
        const data = await apiGet("/stats");
        setStats(data);
      } catch (_) {}
    }
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [wsDetections]);

  return {
    in: stats.in,
    out: stats.out,
    total: stats.total,
    inFrame: stats.in_frame,
  };
}

// ─── useTimestamp ────────────────────────────────────────────────────────────
export function useTimestamp() {
  const [time, setTime] = useState(getFormattedTime());
  useEffect(() => {
    const timer = setInterval(() => setTime(getFormattedTime()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

function getFormattedTime() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

// ─── useSafetyStatus ─────────────────────────────────────────────────────────
// Pass wsDetections when WS mode === "SAFETY" — polling is skipped automatically.
export function useSafetyStatus(active = true, wsDetections = null) {
  const [data, setData] = useState({ status: "SAFE", count: 0, image: null });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastAppendRef = useRef(0);

  // ✅ Clear on every mount (handles tab switch + page reload)
  useEffect(() => {
    setData({ status: "SAFE", count: 0, image: null });
    setHistory([]);
    setLoading(true);
  }, []);

  // ✅ Clear when stream stops
  useEffect(() => {
    if (!active) {
      setData({ status: "SAFE", count: 0, image: null });
      setHistory([]);
      setLoading(true);
    }
  }, [active]);

  // WS path
  useEffect(() => {
    if (!wsDetections) return;
    setLoading(false);

    const res = {
      status: wsDetections.safety_active ? "UNSAFE" : "SAFE",
      count: wsDetections.people_in_safety_zone ?? 0,
      image: wsDetections.image ?? null,
    };
    setData(res);

    if (res.status !== "SAFE" && res.count > 0) {
      const now = Date.now();
      if (now - lastAppendRef.current >= 3000) {
        lastAppendRef.current = now;
        setHistory((prev) => [
          {
            id: now,
            status: res.status,
            count: res.count,
            image: res.image,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 49),
        ]);
      }
    }
  }, [wsDetections]);

  // Fallback polling
  useEffect(() => {
    if (!active || wsDetections !== null) return;

    async function poll() {
      try {
        const res = await apiGet("/safety_status");
        setData(res);
        if (res.status !== "SAFE" && res.count > 0) {
          const now = Date.now();
          if (now - lastAppendRef.current >= 3000) {
            lastAppendRef.current = now;
            setHistory((prev) => [
              {
                id: now,
                status: res.status,
                count: res.count,
                image: res.image,
                time: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 49),
            ]);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [active, wsDetections]);

  return { data, history, loading };
}

// ─── useAnimalStatus ─────────────────────────────────────────────────────────
// Pass wsDetections when WS mode === "ANIMAL" — polling is skipped automatically.
export function useAnimalStatus(active = true, wsDetections = null) {
  const [data, setData] = useState({
    detected: false,
    animal: null,
    confidence: 0,
    image: null,
    dangerous: false,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastAppendRef = useRef(0);

  // WS path
  useEffect(() => {
    if (!active || wsDetections !== null) return;

    async function poll() {
      try {
        const res = await getAnimalStatus(); // ← was: apiGet("/animal_status")
        setData(res);
        if (res.detected && res.animal) {
          const now = Date.now();
          if (now - lastAppendRef.current >= 3000) {
            lastAppendRef.current = now;
            setHistory((prev) => [
              {
                id: now,
                animal: res.animal,
                confidence: res.confidence,
                dangerous: res.dangerous,
                image: res.image,
                time: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 49),
            ]);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [active, wsDetections]);

  // Fallback polling
  useEffect(() => {
    if (!active || wsDetections !== null) return;

    async function poll() {
      try {
        const res = await apiGet("/animal_status");
        setData(res);
        if (res.detected && res.animal) {
          const now = Date.now();
          if (now - lastAppendRef.current >= 3000) {
            lastAppendRef.current = now;
            setHistory((prev) => [
              {
                id: now,
                animal: res.animal,
                confidence: res.confidence,
                dangerous: res.dangerous,
                image: res.image,
                time: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 49),
            ]);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [active, wsDetections]);

  return { data, history, loading };
}

// ─── usePlateStatus ───────────────────────────────────────────────────────────
// Pass wsDetections when WS mode === "PLATE" — polling is skipped automatically.
export function usePlateStatus(active = true, wsDetections = null) {
  const [data, setData] = useState({
    detected: false,
    plate_number: null,
    vehicle_type: null,
    image: null,
  });
  const [loading, setLoading] = useState(true);

  // WS path — live data from WebSocket
  useEffect(() => {
    if (!wsDetections) return;
    setLoading(false);
    setData({
      detected: wsDetections.detected ?? false,
      plate_number: wsDetections.plate_number ?? null,
      vehicle_type: wsDetections.vehicle_type ?? null,
      image: wsDetections.image ?? null,
    });
  }, [wsDetections]);

  // Fallback polling (only when no WS data)
  useEffect(() => {
    if (!active || wsDetections !== null) return;

    async function poll() {
      try {
        const res = await apiGet("/plate_status");
        setData({
          detected: res.detected ?? false,
          plate_number: res.plate_number ?? null,
          vehicle_type: res.vehicle_type ?? null,
          image: res.image ?? null,
        });
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [active, wsDetections]);

  return { data, loading };
}

// ─── useFireStatus ───────────────────────────────────────────────────────────
// Connects directly to the Fire microservice (FIRE_URL) so it works even when
// the main backend is not available.
// Pass wsDetections when WS mode === "FIRE" — polling is skipped automatically.
export function useFireStatus(active = true, wsDetections = null) {
  const [data, setData] = useState({
    detected: false,
    status: "No Detection",
    image: null,
    camera_id: null,
    detected_at: 0,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentRef = useRef(null);

  function appendHistory(status, image, camera_id, label = null) {
    setHistory((prev) => [
      {
        id: Date.now() + Math.random(),
        status,
        image,
        camera_id,
        label,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 49),
    ]);
  }

  // ── WS path ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wsDetections) return;
    setLoading(false);

    const res = wsDetections;
    if (res.detected) {
      setData(res);
      const prev = currentRef.current;
      const isNew = !prev || !prev.detected;
      if (isNew) appendHistory(res.status, res.image ?? null, res.camera_id);
      currentRef.current = { ...res };
    } else {
      if (currentRef.current?.detected) {
        const p = currentRef.current;
        appendHistory(p.status, p.image, p.camera_id, "Fire cleared");
        currentRef.current = null;
      }
      setData({
        detected: false,
        status: res.status ?? "No Detection",
        image: null,
        camera_id: null,
        detected_at: 0,
      });
    }
  }, [wsDetections]);

  // ── Fire microservice polling (no WS, no main backend required) ───────────
  // Reads the active RTSP job_id from localStorage (shared with useFireRtsp).
  // If no session is running it stays in a graceful "no session" state.
  useEffect(() => {
    if (!active || wsDetections !== null) return;
    currentRef.current = null;
    setLoading(true);

    let cancelled = false;
    let failures = 0;

    // Resolve the current job_id — first try localStorage, then list sessions.
    async function resolveJobId() {
      const stored = localStorage.getItem(FIRE_RTSP_STORAGE_KEY);
      if (stored) return stored;
      try {
        const sessions = await listFireRtspSessions();
        // Backend returns { value: [...], Count: N } — handle all shapes
        const list = Array.isArray(sessions)
          ? sessions
          : Array.isArray(sessions?.value)
            ? sessions.value
            : Array.isArray(sessions?.sessions)
              ? sessions.sessions
              : [];
        const active_session = list.find(
          (s) => s.status !== "stopped" && s.status !== "error",
        );
        return active_session ? String(active_session.job_id ?? active_session.id) : null;
      } catch {
        return null;
      }
    }

    // Normalise the fire-microservice status response into the shape that
    // FireDetection.jsx already expects: { detected, status, image, camera_id }
    function normalise(res, jobId) {
      const fireDetected = !!(
        res.fire_detected ?? res.fire ?? res.detected
      );
      const smokeDetected = !!(
        res.smoke_detected ?? res.smoke
      );
      const isDetected = fireDetected || smokeDetected;

      let statusLabel = "No Detection";
      if (fireDetected && smokeDetected) statusLabel = "Fire & Smoke";
      else if (fireDetected) statusLabel = "Fire Detected";
      else if (smokeDetected) statusLabel = "Smoke Detected";

      return {
        detected: isDetected,
        status: isDetected ? statusLabel : (res.status ?? "No Detection"),
        image: res.image ?? res.frame ?? null,
        camera_id: res.camera_id ?? jobId ?? null,
        detected_at: isDetected ? Date.now() : 0,
      };
    }

    async function poll() {
      const jobId = await resolveJobId();

      // No active session — show idle state.
      if (!jobId) {
        if (!cancelled) {
          setLoading(false);
          setData({
            detected: false,
            status: "No active session",
            image: null,
            camera_id: null,
            detected_at: 0,
          });
          currentRef.current = null;
        }
        return;
      }

      try {
        const raw = await getFireRtspStatus(jobId);
        if (cancelled) return;
        failures = 0;
        const res = normalise(raw, jobId);

        if (res.detected) {
          setData(res);
          const prev = currentRef.current;
          const isNew = !prev || !prev.detected;
          if (isNew)
            appendHistory(res.status, res.image, res.camera_id);
          currentRef.current = { detected: true, ...res };
        } else {
          if (currentRef.current?.detected) {
            const p = currentRef.current;
            appendHistory(p.status, p.image, p.camera_id, "Fire cleared");
            currentRef.current = null;
          }
          setData(res);
        }
      } catch (_) {
        if (cancelled) return;
        failures += 1;
        // After repeated failures, session likely ended — reset gracefully.
        if (failures >= 3) {
          localStorage.removeItem(FIRE_RTSP_STORAGE_KEY);
          setData({
            detected: false,
            status: "No active session",
            image: null,
            camera_id: null,
            detected_at: 0,
          });
          currentRef.current = null;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active, wsDetections]);

  return { data, history, loading, appendHistory };
}
