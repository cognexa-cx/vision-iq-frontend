import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";
import { getCloneStatus } from "../api/clones";

const CROWD_MODE_ALIASES = new Set([
  "crowd",
  "crowd_detection",
  "crowd_monitoring",
]);

function normalizeMode(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, "_");
}

function isCrowdClone(clone) {
  const mode = normalizeMode(clone?.mode);
  if (CROWD_MODE_ALIASES.has(mode)) return true;

  const name = normalizeMode(clone?.name);
  return CROWD_MODE_ALIASES.has(name) || name.includes("crowd");
}

function isRunning(clone, status) {
  if (typeof status?.running === "boolean") return status.running;
  if (typeof clone?.running === "boolean") return clone.running;
  return (
    status?.status === "running" ||
    clone?.status === "running" ||
    clone?.enabled === true
  );
}

// ─── useCrowdClones ───────────────────────────────────────────────────────────
// Fetches all clones from port 8000 and keeps only crowd-mode clones.
// Crowd detection runs through the main backend clone system — not port 9005 directly.
export function useCrowdClones(pollInterval = 4000) {
  const [clones, setClones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClones = useCallback(async () => {
    try {
      const all = await apiGet("/api/clones");
      const crowdClones = (all ?? []).filter(isCrowdClone);
      const statusResults = await Promise.allSettled(
        crowdClones.map((c) =>
          getCloneStatus(c.id).then((status) => ({ id: c.id, status })),
        ),
      );
      const statusMap = {};
      statusResults.forEach((result) => {
        if (result.status === "fulfilled") {
          statusMap[result.value.id] = result.value.status;
        }
      });
      const crowd = crowdClones.map((clone) => {
        const status = statusMap[clone.id];
        const running = isRunning(clone, status);
        return {
          ...clone,
          mode: "crowd",
          running,
          status: running ? "running" : "stopped",
          latest_payload:
            status?.latest_payload ?? clone.latest_payload ?? null,
        };
      });
      setClones(crowd);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClones();
    const id = setInterval(fetchClones, pollInterval);
    return () => clearInterval(id);
  }, [fetchClones, pollInterval]);

  return { clones, loading, error, refetch: fetchClones };
}

// ─── useCrowdCloneStatus ──────────────────────────────────────────────────────
// Polls /api/clones/{id}/status every `pollInterval` ms.
// Extracts crowd_alert from latest_payload — this is where the backend
// stores: person_count, crowd_limit, confirmed, active, image.
export function useCrowdCloneStatus(cloneId, pollInterval = 2000) {
  const [crowdData, setCrowdData] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cloneId) {
      setCrowdData(null);
      setImgSrc(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setCrowdData(null);
    setImgSrc(null);

    async function poll() {
      try {
        const res = await getCloneStatus(cloneId);
        if (!mounted) return;
        const payload = res?.latest_payload;
        if (payload?.crowd_alert) setCrowdData(payload.crowd_alert);
        if (payload?.image)
          setImgSrc(`data:image/jpeg;base64,${payload.image}`);
      } catch (_) {
      } finally {
        if (mounted) setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, pollInterval);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [cloneId, pollInterval]);

  return { crowdData, imgSrc, loading };
}
