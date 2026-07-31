import { useState, useEffect, useRef, useCallback } from "react";
import {
  startFireRtsp,
  getFireRtspStatus,
  listFireRtspSessions,
  stopFireRtspAlert,
  stopFireRtspSession,
} from "../api/fire";

const STORAGE_KEY = "fireRtspJobId";

export function useFireRtsp() {
  const [jobId, setJobId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  );
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null); // { fire_detected, smoke_detected, ... }
  const jobIdRef = useRef(jobId);
  jobIdRef.current = jobId;

  function clearSession(message) {
    localStorage.removeItem(STORAGE_KEY);
    setJobId(null);
    setStatus(null);
    if (message) setError(message);
  }

  // Recover an existing session on mount (page refresh) instead of restarting it.
  useEffect(() => {
    if (!jobId) return;
    listFireRtspSessions()
      .then((sessions) => {
        // Backend returns { value: [...], Count: N } — handle all shapes
        const list = Array.isArray(sessions)
          ? sessions
          : Array.isArray(sessions?.value)
            ? sessions.value
            : Array.isArray(sessions?.sessions)
              ? sessions.sessions
              : [];
        const session = list.find(
          (s) => String(s.job_id ?? s.id) === String(jobId),
        );
        if (!session) {
          // Only clear if the backend confirms the session is truly gone
          clearSession(null);
        } else if (session.status === "error") {
          clearSession(
            "The camera connection failed — check the RTSP URL, port and credentials.",
          );
        }
        // If session exists and status is "live" — keep it, don't restart
      })
      .catch(() => {}); // Network error on mount — keep the stored jobId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async (rtsp_url, name) => {
    setStarting(true);
    setError(null);
    try {
      const res = await startFireRtsp(rtsp_url, name);
      const id = res.job_id ?? res.id;
      if (!id) throw new Error("Backend did not return a job_id");
      localStorage.setItem(STORAGE_KEY, id);
      setJobId(id);
      return id;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setStarting(false);
    }
  }, []);

  const stop = useCallback(async () => {
    const id = jobIdRef.current;
    if (!id) return;
    localStorage.removeItem(STORAGE_KEY);
    setJobId(null);
    setStatus(null);
    try {
      await stopFireRtspSession(id);
    } catch (_) {}
  }, []);

  const stopAlert = useCallback(async () => {
    const id = jobIdRef.current;
    if (!id) return;
    try {
      await stopFireRtspAlert(id);
    } catch (_) {}
  }, []);

  // Poll status while a session is active.
  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    let failures = 0;
    async function poll() {
      try {
        const res = await getFireRtspStatus(jobId);
        if (cancelled) return;
        failures = 0;
        setStatus(res);
      } catch (e) {
        if (cancelled) return;
        failures += 1;
        // A couple of consecutive failures means the session died on the backend.
        if (failures >= 2) {
          clearSession(
            "Lost connection to the camera stream — the session ended on the backend.",
          );
        }
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  return { jobId, starting, error, status, start, stop, stopAlert };
}
