import { useState, useEffect, useCallback, useRef } from "react";
import {
  listStreams,
  stopStream,
  startRtspStream,
  uploadStream,
  enableModule,
} from "../api/vision";
import {
  getRegistry,
  registerCamera,
  unregisterCamera,
  getUploadFile,
  storeUploadFile,
} from "../utils/cameraRegistry";

// A "camera" is a stream on the new AI Vision Backend, but the backend
// itself has no "stopped but still exists" state — stopping a stream
// deletes it outright (confirmed live). So a stopped camera is kept
// visible using the client-side registry (see utils/cameraRegistry) merged
// with whatever's actually live right now.
function toCamera(s, registryEntry) {
  return {
    id: s.stream_id,
    name: registryEntry?.name ?? s.stream_id,
    transport: s.source_type,
    enabled: s.running,
    running: s.running,
    status: s.running ? "running" : "stopped",
    frame_count: s.frame_count,
    active_modules: s.active_modules,
    created_at: s.created_at,
  };
}

function stoppedPlaceholder(id, entry) {
  return {
    id,
    name: entry.name,
    transport: entry.sourceType,
    enabled: false,
    running: false,
    status: "stopped",
    frame_count: 0,
    active_modules: [],
    created_at: entry.createdAt,
  };
}

// Recreates a stream and re-attaches whatever detection modules it had —
// confirmed live: re-uploading/re-starting an id that's still registered on
// the backend (even with running:false) fails with "already active", and a
// stop+recreate always resets active_modules to []. So a real restart is
// always: stop, recreate, then re-enable each module that was running.
async function restartCamera(id, entry, modulesToRestore, preloadedFile = null) {
  const file =
    entry.sourceType === "upload"
      ? (preloadedFile ?? (await getUploadFile(id)))
      : null;

  if (entry.sourceType === "upload") {
    if (!file) {
      throw new Error(
        "The original video file isn't available anymore — delete this camera and upload it again to restart it.",
      );
    }
    await stopStream(id).catch(() => {});
    await uploadStream(file, () => {}, id);
  } else {
    if (!entry.rtspSource) {
      throw new Error("No RTSP URL saved for this camera — can't restart it.");
    }
    await stopStream(id).catch(() => {});
    await startRtspStream(entry.rtspSource, id);
  }

  for (const mode of modulesToRestore ?? []) {
    await enableModule(mode, id).catch(() => {});
  }
}

export function useCameras(pollInterval = 5000) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const streamsRef = useRef([]);
  // Uploaded videos play once and stop on their own (confirmed live: the
  // backend has no loop option) — unlike RTSP, which just stays connected.
  // To make an uploaded camera behave the same as RTSP (continuously live,
  // detectable), auto-restart it — with its detection modules — the moment
  // playback ends. Only applies to a stream still present with
  // running:false — an explicit user Stop deletes the stream from the list
  // entirely, so this never fights that.
  const restartingRef = useRef(new Set());

  const fetchCameras = useCallback(async () => {
    try {
      const streams = await listStreams();
      if (Array.isArray(streams)) {
        streamsRef.current = streams;
        const registry = getRegistry();
        const liveIds = new Set(streams.map((s) => s.stream_id));

        const live = streams.map((s) => {
          // A stream running that we don't already know about (e.g. added
          // before this registry existed) — register it so it doesn't just
          // disappear the first time someone stops it.
          if (!registry[s.stream_id]) {
            registerCamera(s.stream_id, {
              name: s.stream_id,
              sourceType: s.source_type === "upload" ? "upload" : "rtsp",
              createdAt: s.created_at ? s.created_at * 1000 : Date.now(),
            });
            registry[s.stream_id] = getRegistry()[s.stream_id];
          }

          if (
            s.source_type === "file" &&
            !s.running &&
            !restartingRef.current.has(s.stream_id)
          ) {
            restartingRef.current.add(s.stream_id);
            (async () => {
              const file = await getUploadFile(s.stream_id);
              if (!file) return;
              await restartCamera(
                s.stream_id,
                registry[s.stream_id],
                s.active_modules,
                file,
              );
            })()
              .catch(() => {})
              .finally(() => restartingRef.current.delete(s.stream_id));
          }

          return toCamera(s, registry[s.stream_id]);
        });

        const stopped = Object.entries(registry)
          .filter(([id]) => !liveIds.has(id))
          .map(([id, entry]) => stoppedPlaceholder(id, entry));

        setCameras([...live, ...stopped]);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCameras, pollInterval]);

  // Restarts a camera using what the registry remembers about it. RTSP
  // cameras can always be recreated (the URL is persisted); uploaded ones
  // are recreated from the file persisted in IndexedDB (survives reloads,
  // same as RTSP's URL does).
  const handleStart = useCallback(
    async (id) => {
      const entry = getRegistry()[id];
      if (!entry) return;

      const live = streamsRef.current.find((s) => s.stream_id === id);
      if (live?.running) return; // already running

      if (live) {
        // Still present on the backend but not running (e.g. an upload
        // that ended right before this click) — needs the full
        // stop-then-recreate restart, module list preserved.
        await restartCamera(id, entry, live.active_modules);
      } else if (entry.sourceType === "upload") {
        const file = await getUploadFile(id);
        if (!file) {
          throw new Error(
            "The original video file isn't available anymore — delete this camera and upload it again to restart it.",
          );
        }
        await uploadStream(file, () => {}, id);
      } else {
        if (!entry.rtspSource) {
          throw new Error("No RTSP URL saved for this camera — can't restart it.");
        }
        await startRtspStream(entry.rtspSource, id);
      }
      await fetchCameras();
    },
    [fetchCameras],
  );

  // Swaps the video on an existing upload camera without recreating the
  // whole camera — same stream_id, same enabled detection modules, just a
  // new file. This is the "Upload" button on an upload camera's card, so a
  // new video doesn't need going through Add Camera each time.
  const handleUploadVideo = useCallback(
    async (id, file) => {
      const entry = getRegistry()[id];
      if (!entry || entry.sourceType !== "upload") {
        throw new Error("This isn't an upload camera.");
      }
      const live = streamsRef.current.find((s) => s.stream_id === id);
      const modulesToRestore = live?.active_modules ?? [];

      await stopStream(id).catch(() => {});
      await uploadStream(file, () => {}, id);
      await storeUploadFile(id, file);
      for (const mode of modulesToRestore) {
        await enableModule(mode, id).catch(() => {});
      }
      await fetchCameras();
    },
    [fetchCameras],
  );

  // Restarts an upload camera's video from frame 0 — used right before
  // enabling a new detection model, so it analyzes from the start instead
  // of wherever the video happened to already be. No-op for RTSP (a live
  // feed has no "start" to rewind to).
  const restartFromStart = useCallback(
    async (id) => {
      const entry = getRegistry()[id];
      if (!entry || entry.sourceType !== "upload") return;
      const live = streamsRef.current.find((s) => s.stream_id === id);
      await restartCamera(id, entry, live?.active_modules ?? []);
      await fetchCameras();
    },
    [fetchCameras],
  );

  // Stops the stream but keeps it visible (as a "stopped" row) via the
  // registry — the backend itself has already forgotten it.
  const handleStop = useCallback(
    async (id) => {
      await stopStream(id);
      await fetchCameras();
    },
    [fetchCameras],
  );

  // The real "remove from the UI for good" action.
  const handleDelete = useCallback(
    async (id) => {
      try {
        await stopStream(id);
      } catch {
        // Already gone on the backend — fine, we're deleting it anyway.
      }
      unregisterCamera(id);
      await fetchCameras();
    },
    [fetchCameras],
  );

  return {
    cameras,
    loading,
    error,
    refetch: fetchCameras,
    handleStart,
    handleStop,
    handleDelete,
    handleUploadVideo,
    restartFromStart,
  };
}
