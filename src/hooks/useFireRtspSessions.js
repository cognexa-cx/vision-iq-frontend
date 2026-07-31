import { useState, useEffect, useCallback } from "react";
import {
  startFireRtsp,
  listFireRtspSessions,
  stopFireRtspSession,
} from "../api/fire";

const STORAGE_KEY = "fireRtspSessions"; // [{ id, jobId, name, rtspUrl }]

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

// Manages any number of cameras, each independently added / started / stopped
// / deleted, backed by its own job_id on the Fire microservice when running.
export function useFireRtspSessions() {
  const [cameras, setCameras] = useState(loadStored);
  const [busyIds, setBusyIds] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
  }, [cameras]);

  // Drop jobIds that died on the backend (e.g. after a page reload).
  useEffect(() => {
    const running = cameras.filter((c) => c.jobId);
    if (running.length === 0) return;
    listFireRtspSessions()
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : (res?.value ?? res?.sessions ?? []);
        const alive = new Set(
          list
            .filter((s) => s.status !== "error")
            .map((s) => String(s.job_id ?? s.id)),
        );
        setCameras((prev) =>
          prev.map((c) =>
            c.jobId && !alive.has(String(c.jobId)) ? { ...c, jobId: null } : c,
          ),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBusy(id, busy) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      busy ? next.add(id) : next.delete(id);
      return next;
    });
  }

  const addCamera = useCallback((rtspUrl, name) => {
    setCameras((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        jobId: null,
        name: name || rtspUrl,
        rtspUrl,
      },
    ]);
  }, []);

  const startCamera = useCallback(
    async (id) => {
      const cam = cameras.find((c) => c.id === id);
      if (!cam || cam.jobId) return;
      setBusy(id, true);
      setError(null);
      try {
        const res = await startFireRtsp(cam.rtspUrl, cam.name);
        const jobId = res.job_id ?? res.id;
        if (!jobId) throw new Error("Backend did not return a job_id");
        setCameras((prev) =>
          prev.map((c) => (c.id === id ? { ...c, jobId } : c)),
        );
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(id, false);
      }
    },
    [cameras],
  );

  const stopCamera = useCallback(
    async (id) => {
      const cam = cameras.find((c) => c.id === id);
      if (!cam?.jobId) return;
      setBusy(id, true);
      try {
        await stopFireRtspSession(cam.jobId);
      } catch (_) {}
      setCameras((prev) =>
        prev.map((c) => (c.id === id ? { ...c, jobId: null } : c)),
      );
      setBusy(id, false);
    },
    [cameras],
  );

  const deleteCamera = useCallback(
    async (id) => {
      const cam = cameras.find((c) => c.id === id);
      if (cam?.jobId) {
        try {
          await stopFireRtspSession(cam.jobId);
        } catch (_) {}
      }
      setCameras((prev) => prev.filter((c) => c.id !== id));
    },
    [cameras],
  );

  return {
    cameras,
    busyIds,
    error,
    addCamera,
    startCamera,
    stopCamera,
    deleteCamera,
  };
}
