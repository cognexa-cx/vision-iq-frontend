import { useState, useRef, useEffect } from "react";
import Footer from "../components/Common/Footer";
import ConfirmModal from "../components/shared/ConfirmModal";
import { useFireRtspSessions } from "../hooks/useFireRtspSessions";
import {
  getFireRtspStreamUrl,
  getFireRtspStatus,
  stopFireRtspAlert,
} from "../api/fire";
import sirenSrc from "../assets/Siren1.mp3";

const ACTION_CONFIG = {
  start: {
    title: "Start Monitoring",
    confirmText: "Start",
    variant: "primary",
    message: (cam) => `Start fire/smoke detection on "${cam.name}"?`,
  },
  stop: {
    title: "Stop Monitoring",
    confirmText: "Stop",
    variant: "danger",
    message: (cam) =>
      `Stop monitoring "${cam.name}"? Its live feed and alerts will pause until you start it again.`,
  },
  delete: {
    title: "Delete Camera",
    confirmText: "Delete",
    variant: "danger",
    message: (cam) =>
      `Remove "${cam.name}" entirely? This cannot be undone — you'll need to re-add its RTSP URL to monitor it again.`,
  },
};

// ─── Siren (5s on / 10s off while triggered) ─────────────────────────────────
function useSiren(triggered, muted) {
  const audioRef = useRef(null);
  const inCycle = useRef(false);
  const trigRef = useRef(triggered);
  const mutedRef = useRef(muted);
  trigRef.current = triggered;
  mutedRef.current = muted;

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  function runCycle() {
    if (!trigRef.current) {
      inCycle.current = false;
      return;
    }
    const el = audioRef.current;
    if (el && !mutedRef.current) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    setTimeout(() => {
      stopAudio();
      setTimeout(() => {
        inCycle.current = false;
        if (trigRef.current) {
          inCycle.current = true;
          runCycle();
        }
      }, 10_000);
    }, 5_000);
  }

  useEffect(() => {
    if (triggered && !inCycle.current) {
      inCycle.current = true;
      runCycle();
    }
    if (!triggered) {
      stopAudio();
      inCycle.current = false;
    }
  }, [triggered]);

  useEffect(() => {
    if (muted) stopAudio();
  }, [muted]);

  useEffect(() => () => stopAudio(), []);
  return audioRef;
}

function extractFlags(status) {
  if (!status) return { fire: false, smoke: false };
  return {
    fire: !!(status.fire_detected ?? status.fire ?? status.detected),
    smoke: !!(status.smoke_detected ?? status.smoke),
  };
}

// Polls this camera's status only while it's running.
function useFireStatus(jobId, isRunning) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isRunning) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await getFireRtspStatus(jobId);
        if (!cancelled) setStatus(res);
      } catch (_) {}
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isRunning, jobId]);

  const { fire, smoke } = extractFlags(status);
  return { isAlert: isRunning && (fire || smoke), fire, smoke };
}

export default function FireDetectionPage({ isCollapsed = false }) {
  const [rtspUrl, setRtspUrl] = useState("");
  const [cameraName, setCameraName] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmRequest, setConfirmRequest] = useState(null); // { camId, action }
  const {
    cameras,
    busyIds,
    error,
    addCamera,
    startCamera,
    stopCamera,
    deleteCamera,
  } = useFireRtspSessions();

  function handleAdd() {
    if (!rtspUrl.trim()) return;
    addCamera(rtspUrl.trim(), cameraName.trim() || undefined);
    setRtspUrl("");
    setCameraName("");
  }

  function requestAction(camId, action) {
    setConfirmRequest({ camId, action });
  }

  async function confirmActionRun() {
    if (!confirmRequest) return;
    const { camId, action } = confirmRequest;
    if (action === "start") await startCamera(camId);
    if (action === "stop") await stopCamera(camId);
    if (action === "delete") {
      await deleteCamera(camId);
      if (expandedId === camId) setExpandedId(null);
    }
    setConfirmRequest(null);
  }

  const runningCount = cameras.filter((c) => c.jobId).length;
  const expandedCam = cameras.find((c) => c.id === expandedId) ?? null;
  const confirmCam = confirmRequest
    ? cameras.find((c) => c.id === confirmRequest.camId)
    : null;
  const confirmCfg = confirmRequest ? ACTION_CONFIG[confirmRequest.action] : null;

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300 left-0 md:left-[80px] ${
        isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"
      }`}
      style={{ background: "#F4F6F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-6 px-4 sm:px-6 pb-6">
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#0F345E" }}
            >
              Fire Detection — Live RTSP
            </h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "#EBF5FF", color: "#0085D4" }}
            >
              {runningCount}/{cameras.length} monitoring
            </span>
          </div>

          {/* ── Add camera form ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://user:pass@ip:port/path"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
              />
              <input
                type="text"
                value={cameraName}
                onChange={(e) => setCameraName(e.target.value)}
                placeholder="Camera name (optional)"
                className="sm:w-56 px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <button
                onClick={handleAdd}
                disabled={!rtspUrl.trim()}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, #0085D4 0%, #024167 100%)",
                }}
              >
                ADD CAMERA
              </button>
            </div>
            {error && (
              <p className="text-xs font-semibold text-red-500">{error}</p>
            )}
          </div>

          {/* ── Camera grid ── */}
          {cameras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-3xl mb-1">📡</span>
              <span className="text-sm font-semibold">
                No cameras added yet — add one above to get started
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cameras.map((cam) => (
                <FireCameraCard
                  key={cam.id}
                  cam={cam}
                  busy={busyIds.has(cam.id)}
                  suppressSiren={cam.id === expandedId}
                  onStart={() => requestAction(cam.id, "start")}
                  onStop={() => requestAction(cam.id, "stop")}
                  onDelete={() => requestAction(cam.id, "delete")}
                  onExpand={() => setExpandedId(cam.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {expandedCam && (
        <FireCameraModal
          cam={expandedCam}
          busy={busyIds.has(expandedCam.id)}
          onStart={() => requestAction(expandedCam.id, "start")}
          onStop={() => requestAction(expandedCam.id, "stop")}
          onDelete={() => requestAction(expandedCam.id, "delete")}
          onClose={() => setExpandedId(null)}
        />
      )}

      <ConfirmModal
        open={!!confirmRequest}
        title={confirmCfg?.title}
        message={confirmCam && confirmCfg ? confirmCfg.message(confirmCam) : ""}
        confirmText={confirmCfg?.confirmText}
        variant={confirmCfg?.variant}
        loading={confirmRequest ? busyIds.has(confirmRequest.camId) : false}
        onConfirm={confirmActionRun}
        onCancel={() => setConfirmRequest(null)}
      />
    </div>
  );
}

// ─── FireCameraCard ───────────────────────────────────────────────────────────
// Each camera polls and alerts fully independently of the others.
function FireCameraCard({
  cam,
  busy,
  suppressSiren,
  onStart,
  onStop,
  onDelete,
  onExpand,
}) {
  const isRunning = !!cam.jobId;
  const [muted, setMuted] = useState(false);
  const { isAlert, fire, smoke } = useFireStatus(cam.jobId, isRunning);
  const audioRef = useSiren(isAlert, muted || suppressSiren);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <audio ref={audioRef} src={sirenSrc} preload="auto" />

      <div
        className="relative w-full bg-[#0f172a] aspect-video flex items-center justify-center group cursor-pointer"
        onClick={onExpand}
      >
        {isRunning ? (
          <FireStream jobId={cam.jobId} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-2xl">⏸</span>
            <span className="text-xs font-semibold">Stopped</span>
          </div>
        )}
        {isAlert && (
          <div
            className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-white text-[10px] font-bold animate-pulse"
            style={{ background: "rgba(239,68,68,0.9)" }}
          >
            🔥 {fire ? "FIRE" : ""} {smoke ? "SMOKE" : ""} DETECTED
          </div>
        )}
        {isRunning && (
          <div
            className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-2xl">
            🔍
          </span>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2">
        <p
          className="text-sm font-bold truncate"
          style={{ color: "#023350" }}
          title={cam.name}
        >
          {cam.name}
        </p>

        {isRunning ? (
          isAlert ? (
            <span className="px-3 py-1 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-xs font-semibold animate-pulse w-fit">
              🔥 ALERT ACTIVE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-green-50 border border-green-300 text-green-600 text-xs font-semibold w-fit">
              ✅ No Fire / Smoke
            </span>
          )
        ) : (
          <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold w-fit">
            Not monitoring
          </span>
        )}

        {isAlert && (
          <button
            onClick={() => setMuted((m) => !m)}
            className="py-1.5 rounded-lg text-xs font-bold border transition-all"
            style={
              muted
                ? {
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#94a3b8",
                  }
                : {
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#ef4444",
                  }
            }
          >
            {muted ? "🔇 MUTED" : "🔊 SIREN ON"}
          </button>
        )}
        {isAlert && (
          <button
            onClick={() => stopFireRtspAlert(cam.jobId).catch(() => {})}
            className="py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Stop Alert
          </button>
        )}

        {/* ── Start / Stop / Delete ── */}
        <div className="flex items-center gap-2 mt-1">
          {!isRunning ? (
            <button
              onClick={onStart}
              disabled={busy}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
              style={{ background: "#22c55e" }}
            >
              {busy ? "Starting…" : "Start"}
            </button>
          ) : (
            <button
              onClick={onStop}
              disabled={busy}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
              style={{ background: "#f59e0b" }}
            >
              {busy ? "Stopping…" : "Stop"}
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={busy}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
            style={{ background: "#ef4444" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FireCameraModal ──────────────────────────────────────────────────────────
// Focused, full-size view of a single camera — click a card to open this.
function FireCameraModal({ cam, busy, onStart, onStop, onDelete, onClose }) {
  const isRunning = !!cam.jobId;
  const [muted, setMuted] = useState(false);
  const { isAlert, fire, smoke } = useFireStatus(cam.jobId, isRunning);
  const audioRef = useSiren(isAlert, muted);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <audio ref={audioRef} src={sirenSrc} preload="auto" />
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: "min(90vw, 900px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full bg-[#0f172a] aspect-video flex items-center justify-center">
          {isRunning ? (
            <FireStream jobId={cam.jobId} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <span className="text-4xl">⏸</span>
              <span className="text-sm font-semibold">Stopped</span>
            </div>
          )}
          {isAlert && (
            <div
              className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-white text-xs font-bold animate-pulse"
              style={{ background: "rgba(239,68,68,0.9)" }}
            >
              🔥 {fire ? "FIRE" : ""} {smoke ? "SMOKE" : ""} DETECTED
            </div>
          )}
          {isRunning && (
            <div
              className="absolute top-3 right-14 px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold" style={{ color: "#023350" }}>
              {cam.name}
            </p>
            {isRunning ? (
              isAlert ? (
                <span className="px-3 py-1 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-xs font-semibold animate-pulse">
                  🔥 ALERT ACTIVE
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-green-50 border border-green-300 text-green-600 text-xs font-semibold">
                  ✅ No Fire / Smoke
                </span>
              )
            ) : (
              <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold">
                Not monitoring
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 font-mono truncate">
            {cam.rtspUrl}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {isAlert && (
              <>
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                  style={
                    muted
                      ? {
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#94a3b8",
                        }
                      : {
                          background: "#fef2f2",
                          border: "1px solid #fca5a5",
                          color: "#ef4444",
                        }
                  }
                >
                  {muted ? "🔇 MUTED" : "🔊 SIREN ON"}
                </button>
                <button
                  onClick={() => stopFireRtspAlert(cam.jobId).catch(() => {})}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  Stop Alert
                </button>
              </>
            )}
            <div className="flex-1" />
            {!isRunning ? (
              <button
                onClick={onStart}
                disabled={busy}
                className="px-5 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "#22c55e" }}
              >
                {busy ? "Starting…" : "Start"}
              </button>
            ) : (
              <button
                onClick={onStop}
                disabled={busy}
                className="px-5 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "#f59e0b" }}
              >
                {busy ? "Stopping…" : "Stop"}
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={busy}
              className="px-5 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
              style={{ background: "#ef4444" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate so the stream <img> only mounts/reconnects when jobId changes.
function FireStream({ jobId }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [jobId]);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <span className="text-2xl">📡</span>
        <span className="text-xs font-semibold">Feed unavailable</span>
      </div>
    );
  }

  return (
    <img
      key={jobId}
      src={getFireRtspStreamUrl(jobId)}
      alt="Fire detection live feed"
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
