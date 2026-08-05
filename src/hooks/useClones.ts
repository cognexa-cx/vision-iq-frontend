import { useState, useEffect, useCallback } from "react";
import { listStreams, enableModule } from "../api/vision";

const MODE_LABEL = {
  fire: "Fire Detection",
  ppe: "PPE Detection",
  animal: "Animal Detection",
};

// A "clone" here is one detection module (fire/ppe/animal) attached to a
// stream. The new backend has no clone registry at all — active_modules is
// just a list of strings on the stream itself — so these are synthesized
// client-side, one per (stream, module) pair. There is also no "disable"
// endpoint for a single module on the backend (only stopping the whole
// stream removes everything attached to it, confirmed against the live
// API) — so "stop" and "delete" here are both client-side: "stop" pauses
// display/polling, "delete" additionally hides it from the list for good
// (until the camera itself is stopped/restarted). The module keeps running
// on the backend regardless; "start" re-calls the real enable endpoint.
function synthesizeClones(streams, pausedIds, deletedIds) {
  const clones = [];
  for (const s of streams) {
    for (const mode of s.active_modules ?? []) {
      const id = `${s.stream_id}::${mode}`;
      if (deletedIds.has(id)) continue;
      const paused = pausedIds.has(id);
      clones.push({
        id,
        camera_id: s.stream_id,
        name: MODE_LABEL[mode] ?? mode,
        mode,
        enabled: true,
        running: s.running && !paused,
        status: s.running && !paused ? "running" : "stopped",
      });
    }
  }
  return clones;
}

export function useClones(pollInterval = 5000) {
  const [clones, setClones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pausedIds, setPausedIds] = useState(() => new Set());
  const [deletedIds, setDeletedIds] = useState(() => new Set());

  const fetchClones = useCallback(async () => {
    try {
      const streams = await listStreams();
      if (Array.isArray(streams)) {
        setClones(synthesizeClones(streams, pausedIds, deletedIds));
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pausedIds, deletedIds]);

  useEffect(() => {
    fetchClones();
    const interval = setInterval(fetchClones, pollInterval);
    return () => clearInterval(interval);
  }, [fetchClones, pollInterval]);

  // id is "{streamId}::{mode}" — enabling re-attaches that module.
  const handleStart = useCallback(
    async (id) => {
      const [streamId, mode] = id.split("::");
      await enableModule(mode, streamId);
      setPausedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchClones();
    },
    [fetchClones],
  );

  // No backend endpoint to disable a single module, so this is a local
  // pause only — the module keeps running server-side, we just stop
  // showing/polling it as "running" in the UI.
  const handleStop = useCallback(async (id) => {
    setPausedIds((prev) => new Set(prev).add(id));
    setClones((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, running: false, status: "stopped" } : c,
      ),
    );
  }, []);

  // No backend endpoint to remove a single module either — this hides it
  // from the UI for good (until the camera is stopped/restarted, which
  // clears active_modules server-side anyway). The module itself keeps
  // running attached to the stream.
  const handleDelete = useCallback(async (id) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    setClones((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    clones,
    loading,
    error,
    refetch: fetchClones,
    handleStart,
    handleStop,
    handleDelete,
  };
}
