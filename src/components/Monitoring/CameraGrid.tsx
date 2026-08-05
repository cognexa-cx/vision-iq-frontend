import { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera,
  X,
  Play,
  Square,
  Trash2,
  RefreshCw,
  Copy,
  UploadCloud,
} from "lucide-react";
import { useCameras } from "../../hooks/useCameras";
import { useClones } from "../../hooks/useClones";
import { useAlerts } from "../../hooks/useAlerts";
import { useLiveStreamSocket } from "../../hooks/useLiveStream";
import { detectOnce } from "../../api/vision";
import ConfirmModal from "../shared/ConfirmModal";
import CloneModal from "./CloneModal";

const MODE_MAP = {
  "Animal Detection": "animal",
  "Railway Detection": "railway",
  "Vehicle Detection": "vehicle",
  "Fall Detection": "fall",
  "PPE Kit Detection": "ppe",
  "PPE Detection": "ppe",
  "Fire Detection": "fire",
  "Head Count": "headcount",
  "Secure Area": "secure_area",
  "Number Plate": "vehicle",
  "Crowd Monitoring": "crowd",
  "Crowd Detection": "crowd",
};

const MODE_META = {
  fall: { label: "Fall", color: "#f59e0b" },
  animal: { label: "Animal", color: "#10b981" },
  vehicle: { label: "Vehicle", color: "#6366f1" },
  railway: { label: "Railway", color: "#ef4444" },
  fire: { label: "Fire", color: "#ef4444" },
  crowd: { label: "Crowd", color: "#0085D4" },
  headcount: { label: "HeadCount", color: "#0085D4" },
  secure_area: { label: "Secure", color: "#7C3AED" },
};

// ─── Alert blink keyframe (injected once) ────────────────────────────────────
const BLINK_STYLE_ID = "viq-alert-blink-style";
if (!document.getElementById(BLINK_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = BLINK_STYLE_ID;
  s.textContent = `
    @keyframes viqAlertBlink {
      0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.55), 0 2px 12px rgba(0,0,0,0.08); border-color: #ef4444; }
      50%       { box-shadow: 0 0 0 1px rgba(239,68,68,0.10), 0 2px 12px rgba(0,0,0,0.08); border-color: rgba(239,68,68,0.25); }
    }
  `;
  document.head.appendChild(s);
}

// ─── LiveStreamView ──────────────────────────────────────────────────────────
// Confirmed live: ws://<vision-backend>/ws/stream/{streamId} pushes raw JPEG
// frames for a running stream (~1fps). Each frame is decoded fully off-screen
// before being drawn to the canvas — swapping an <img src> directly caused
// visible tearing/corruption because the previous frame's blob URL could get
// revoked while still mid-decode.
function LiveStreamView({ streamId, isRunning, alt }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connected, setConnected] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  // Rolling average of recent good frame sizes — the backend's RTSP→JPEG
  // pipeline occasionally emits corrupted (washed-out gray) frames that are
  // ~3x smaller than a normal frame from the same camera (confirmed by
  // inspecting raw frames directly: a clean 386KB frame followed by
  // corrupted 114KB/136KB frames). Not a perfect signal, but a sudden big
  // drop reliably flags corruption without needing to inspect pixel data.
  const avgSizeRef = useRef(0);

  useEffect(() => {
    setHasFrame(false);
    avgSizeRef.current = 0;
  }, [streamId, isRunning]);

  useLiveStreamSocket(
    streamId,
    !!isRunning,
    (img, byteLength) => {
      const avg = avgSizeRef.current;
      if (avg > 0 && byteLength < avg * 0.5) return; // looks corrupted — keep last good frame
      avgSizeRef.current = avg > 0 ? avg * 0.8 + byteLength * 0.2 : byteLength;

      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== img.naturalWidth) canvas.width = img.naturalWidth;
      if (canvas.height !== img.naturalHeight)
        canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      setHasFrame(true);
    },
    setConnected,
  );

  if (!isRunning) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ objectFit: "cover", display: hasFrame ? "block" : "none" }}
        title={alt}
      />
      {!hasFrame && (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          title={alt}
        >
          <RefreshCw size={18} className="text-white opacity-30 animate-spin" />
          <span className="font-poppins text-[10px] text-white opacity-40 text-center px-2">
            {connected ? "Waiting for frames…" : "Connecting…"}
          </span>
        </div>
      )}
    </>
  );
}

// ─── DetectionStatusPanel ────────────────────────────────────────────────────
// Real detection data, polled directly from POST /api/v1/{mode}/detect
// against the stream's latest frame — this is the actual, confirmed-live
// response shape (e.g. Animal: {is_animal, is_wild_animal, category,
// bounding_box}), not mock data. Renders whatever fields come back rather
// than assuming a fixed shape, since Fire/PPE's exact fields aren't
// confirmed field-by-field yet.
function DetectionStatusPanel({ mode, streamId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mode || !streamId) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await detectOnce(mode, { streamId });
        if (!cancelled) {
          setResult(res);
          setError(null);
        }
      } catch (e) {
        // The backend throttles /detect to its own frame_interval_seconds,
        // and briefly has "no frames yet" right after a stream (re)starts —
        // both harmless and transient, just keep showing the last good
        // result instead of surfacing them as errors.
        const msg = e.message ?? "";
        const isTransient = /throttled|no frames yet/i.test(msg);
        if (!cancelled && !isTransient) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    poll();
    // The backend itself processes at ~1fps (frame_interval_seconds: 1.0,
    // confirmed via /health) — polling much slower than that (this used to
    // be 3000ms) makes the status lag visibly behind the detection overlay
    // baked into the video frames, which updates every ~1s. 1100ms keeps us
    // just above the backend's own throttle window instead of matching it
    // exactly and getting "Throttled" on every other request.
    const id = setInterval(poll, 1100);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mode, streamId]);

  const boxes = result?.bounding_box ?? [];
  const hasBoxes = Array.isArray(boxes) && boxes.length > 0;

  // Confirmed live PPE shape: { persons: [{ person_id, helmet, safety_shoes,
  // bounding_box }, ...] } — no top-level compliant/missing_items field.
  // Any boolean === false on a person (other than person_id/bounding_box) is
  // a missing item for that person.
  const persons = mode === "ppe" ? (result?.persons ?? []) : [];
  const personViolations = persons.map((p) => ({
    id: p.person_id,
    missing: Object.entries(p)
      .filter(([k, v]) => k !== "person_id" && k !== "bounding_box" && v === false)
      .map(([k]) => k.replace(/_/g, " ")),
  }));
  const ppeHasViolation = personViolations.some((p) => p.missing.length > 0);

  // Fire's exact field names aren't confirmed live the way PPE's and
  // Animal's are (PPE's guessed shape turned out wrong — real backend used
  // `persons`, not `compliant`/`missing_items` — so don't trust a single
  // guessed key here either). Check the plausible name variants and treat
  // any of them being truthy as a hit.
  const isFire = !!(result?.is_fire ?? result?.fire_detected ?? result?.fire);
  const isSmoke = !!(
    result?.is_smoke ??
    result?.smoke_detected ??
    result?.smoke
  );

  const isAlert =
    isFire ||
    isSmoke ||
    result?.is_wild_animal ||
    (mode === "ppe" ? ppeHasViolation : hasBoxes);

  const meta = MODE_META[mode] ?? { label: mode, color: "#0085D4" };

  return (
    <div
      className="flex-1 p-4 sm:p-5"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3
          className="font-poppins text-[14px] sm:text-[15px] font-semibold"
          style={{ color: "#023350" }}
        >
          {meta.label} Status
        </h3>
        {loading && (
          <RefreshCw
            size={13}
            className="animate-spin"
            style={{ color: meta.color }}
          />
        )}
      </div>

      {error ? (
        <p className="font-poppins text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      ) : !result ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <span className="text-2xl mb-1">📡</span>
          <span className="font-poppins text-[12px]">
            Waiting for the first detection…
          </span>
        </div>
      ) : (
        <>
          <div
            className="p-3 rounded-lg text-center font-poppins text-[13px] font-semibold mb-3"
            style={
              isAlert
                ? { background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5" }
                : { background: "#f0fdf4", color: "#22c55e", border: "1px solid #86efac" }
            }
          >
            {mode === "fire" &&
              (isFire || isSmoke
                ? `🔥 ${isFire ? "FIRE" : ""} ${isSmoke ? "SMOKE" : ""} DETECTED`
                : "✅ No fire/smoke detected")}
            {mode === "animal" &&
              (result.is_animal ? "🐾 Animal Detected" : "✅ No animal detected")}
            {mode === "ppe" &&
              (persons.length === 0
                ? "✅ No person detected"
                : ppeHasViolation
                  ? `🦺 PPE violation — ${personViolations.filter((p) => p.missing.length > 0).length}/${persons.length} non-compliant`
                  : "✅ PPE compliant")}
          </div>

          {mode === "ppe" && persons.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {personViolations.map((p) => (
                <p key={p.id} className="font-poppins text-[11px] text-gray-600">
                  <span className="font-medium" style={{ color: "#023350" }}>
                    Person {p.id}:
                  </span>{" "}
                  {p.missing.length > 0
                    ? `missing ${p.missing.join(", ")}`
                    : "compliant"}
                </p>
              ))}
            </div>
          )}

          {mode !== "ppe" && hasBoxes && (
            <p className="font-poppins text-[11px] text-gray-500 mb-2">
              {boxes.length} bounding box{boxes.length === 1 ? "" : "es"} in latest frame
            </p>
          )}

          {/* Any other fields the backend returned, as plain readable lines
              instead of raw JSON — covers fields not called out above
              without assuming a fixed response shape. */}
          {(() => {
            const shown = new Set([
              "is_fire",
              "fire_detected",
              "fire",
              "is_smoke",
              "smoke_detected",
              "smoke",
              "is_animal",
              "is_wild_animal",
              "category",
              "bounding_box",
              "persons",
            ]);
            const extra = Object.entries(result).filter(
              ([key, val]) => !shown.has(key) && val !== null && val !== undefined,
            );
            if (extra.length === 0) return null;
            return (
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 flex flex-col gap-1">
                {extra.map(([key, val]) => (
                  <p
                    key={key}
                    className="font-poppins text-[11px] text-gray-500"
                  >
                    <span className="font-medium" style={{ color: "#023350" }}>
                      {key.replace(/_/g, " ")}:
                    </span>{" "}
                    {Array.isArray(val)
                      ? val.length === 0
                        ? "none"
                        : val
                            .map((v) =>
                              typeof v === "object" ? JSON.stringify(v) : String(v),
                            )
                            .join(", ")
                      : typeof val === "boolean"
                        ? val
                          ? "yes"
                          : "no"
                        : typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val)}
                  </p>
                ))}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ─── RightPanel ──────────────────────────────────────────────────────────────
function RightPanel({ mode, streamId }) {
  return <DetectionStatusPanel mode={mode} streamId={streamId} />;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function cloneHasAlert(clone, alertMap) {
  if (alertMap[String(clone.id)] !== undefined) return true;
  if (
    clone.mode === "crowd" &&
    clone.latest_payload?.crowd_alert?.confirmed === true &&
    clone.latest_payload?.crowd_alert?.active === true
  )
    return true;
  return false;
}

// ─── CameraCard ──────────────────────────────────────────────────────────────
function CameraCard({
  cam,
  camIndex,
  onClick,
  selected,
  onStart,
  onStop,
  onUploadVideo,
  onDeleteRequest,
  onCloneRequest,
  actionLoading,
}) {
  const isRunning = cam.running ?? cam.status === "running";
  const isUploadCam = cam.transport === "upload" || cam.transport === "file";
  const uploadInputRef = useRef(null);
  return (
    <div
      onClick={() => onClick(cam.id)}
      className="bg-white rounded-2xl cursor-pointer transition-all hover:shadow-lg p-3 flex flex-col h-full"
      style={{
        border: `1.5px solid ${selected ? "#0085D4" : "rgba(0,0,0,0.10)"}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-2 flex-shrink-0 px-0.5">
        <span
          className="font-poppins text-[13px] font-semibold truncate"
          style={{ color: "#023350" }}
        >
          {cam.name ?? `CAM ${camIndex + 1}`}
        </span>
        {isRunning && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold font-poppins flex-shrink-0 ml-2"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
            REC
          </span>
        )}
      </div>

      <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden flex-1 min-h-[220px]">
        <LiveStreamView streamId={cam.id} isRunning={isRunning} alt={cam.name} />
        {!isRunning && (
          <div className="flex flex-col items-center justify-center gap-2 opacity-30">
            <Camera size={24} className="text-white" />
            <span className="text-white text-[11px] font-poppins">Stopped</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 flex-shrink-0">
        <div className="min-w-0">
          <p
            className="font-poppins text-[12px] sm:text-[13px] font-medium truncate"
            style={{ color: "#023350" }}
          >
            ID: <span style={{ color: "#0085D4" }}>{cam.id}</span>
          </p>
          <p
            className="font-poppins text-[11px] sm:text-[12px] font-medium mt-1 truncate"
            style={{ color: "#023350" }}
          >
            Type:{" "}
            <span className="font-normal" style={{ color: "#4A4A4A" }}>
              {cam.transport ?? "—"}
            </span>
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 flex-shrink-0 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => (isRunning ? onStop(cam.id) : onStart(cam.id))}
            disabled={actionLoading.has(cam.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
            style={{ background: isRunning ? "#ef4444" : "#22c55e" }}
          >
            {actionLoading.has(cam.id) ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : isRunning ? (
              <Square size={12} />
            ) : (
              <Play size={12} />
            )}
          </button>
          <button
            onClick={() => onCloneRequest(cam)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            style={{ background: "#0085D4" }}
          >
            <Copy size={12} />
          </button>
          {isUploadCam && (
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) onUploadVideo(cam.id, file);
                }}
              />
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={actionLoading.has(cam.id)}
                title="Upload a new video to this camera"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
                style={{ background: "#7C3AED" }}
              >
                <UploadCloud size={12} />
              </button>
            </>
          )}
          <button
            onClick={() => onDeleteRequest(cam)}
            className="w-7 h-7 flex items-center justify-center hover:opacity-70"
          >
            <Trash2 size={13} style={{ color: "#ef4444" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MiniCloneCard ────────────────────────────────────────────────────────────
function MiniCloneCard({
  clone,
  onClick,
  selected,
  onStart,
  onStop,
  onDeleteRequest,
  actionLoading,
  hasAlert,
}) {
  const isRunning = clone.running ?? clone.status === "running";
  const showAlert = hasAlert;

  return (
    <div
      onClick={() => onClick(clone.id)}
      className="relative flex flex-col rounded-xl cursor-pointer overflow-hidden bg-white w-full transition-all hover:shadow-md"
      style={{
        border: showAlert
          ? "2px solid #ef4444"
          : `1.5px solid ${selected ? "#7C3AED" : "#e2e8f0"}`,
        boxShadow: showAlert
          ? "0 0 0 2px rgba(239,68,68,0.35), 0 2px 8px rgba(0,0,0,0.06)"
          : selected
            ? "0 0 0 2px rgba(124,58,237,0.25), 0 2px 8px rgba(0,0,0,0.06)"
            : "0 2px 8px rgba(0,0,0,0.06)",
        animation: showAlert ? "viqAlertBlink 1s ease-in-out infinite" : "none",
      }}
    >
      <div
        className="relative bg-[#0f172a] flex items-center justify-center overflow-hidden"
        style={{ height: "140px" }}
      >
        <LiveStreamView streamId={clone.camera_id} isRunning={isRunning} alt={clone.name} />
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Camera size={16} className="text-white" />
          </div>
        )}
        {showAlert && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center py-0.5 font-poppins text-[8px] font-bold text-white"
            style={{ background: "rgba(239,68,68,0.92)" }}
          >
            🚨 ALERT
          </div>
        )}
        {isRunning && !showAlert && (
          <div
            className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="font-poppins text-[7px] font-bold text-white">
              REC
            </span>
          </div>
        )}
        <div
          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded font-poppins text-[7px] font-bold"
          style={{ background: "rgba(124,58,237,0.82)", color: "#fff" }}
        >
          CLONE
        </div>
        {clone.mode && MODE_META[clone.mode] && (
          <div
            className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded font-poppins text-[7px] font-bold text-white truncate"
            style={{
              background: `${MODE_META[clone.mode].color}cc`,
              maxWidth: "64px",
            }}
          >
            {MODE_META[clone.mode].label}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-2 py-2 gap-1">
        <span
          className="font-poppins text-[11px] font-semibold truncate"
          style={{ color: selected ? "#7C3AED" : "#023350" }}
        >
          {clone.name ?? `Clone ${clone.id}`}
        </span>
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Stop is a client-side pause — the backend has no per-module
              disable endpoint, so this just stops polling/showing this
              clone as running locally. Start re-calls the real enable API. */}
          {isRunning ? (
            <button
              onClick={() => onStop(clone.id)}
              disabled={actionLoading.has(clone.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
              style={{ background: "#ef4444" }}
            >
              {actionLoading.has(clone.id) ? (
                <RefreshCw size={9} className="animate-spin" />
              ) : (
                <Square size={9} />
              )}
            </button>
          ) : (
            <button
              onClick={() => onStart(clone.id)}
              disabled={actionLoading.has(clone.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
              style={{ background: "#22c55e" }}
            >
              {actionLoading.has(clone.id) ? (
                <RefreshCw size={9} className="animate-spin" />
              ) : (
                <Play size={9} />
              )}
            </button>
          )}
          <button
            onClick={() => onDeleteRequest(clone)}
            className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity"
            title="Remove this model from the list"
          >
            <Trash2 size={10} style={{ color: "#ef4444" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CloneGroup ───────────────────────────────────────────────────────────────
function CloneGroup({
  camera,
  clones,
  alertMap,
  selectedId,
  selectedType,
  onClickClone,
  onStart,
  onStop,
  onDeleteRequest,
  actionLoading,
}) {
  const sortedClones = useMemo(() => {
    const withAlert = clones.filter((c) => cloneHasAlert(c, alertMap));
    const withoutAlert = clones.filter((c) => !cloneHasAlert(c, alertMap));
    withAlert.sort(
      (a, b) => (alertMap[String(b.id)] ?? 0) - (alertMap[String(a.id)] ?? 0),
    );
    return [...withAlert, ...withoutAlert];
  }, [clones, alertMap]);

  const hasAnyAlert = sortedClones.some((c) => cloneHasAlert(c, alertMap));

  return (
    <div
      className="rounded-xl overflow-hidden h-full"
      style={{
        border: hasAnyAlert ? "1.5px solid #fca5a5" : "1px solid #e2e8f0",
        background: "#fafbfc",
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          borderBottom: "1px solid #e2e8f0",
          background: hasAnyAlert ? "#fef2f2" : "#f1f5f9",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: "#0085D4" }}
        />
        <span
          className="font-poppins text-[11px] font-semibold"
          style={{ color: "#023350" }}
        >
          {camera.name ?? `Camera ${camera.id}`}
        </span>
        <span className="font-poppins text-[10px]" style={{ color: "#64748b" }}>
          Clones
        </span>
        {hasAnyAlert && <span className="text-[10px]">🚨</span>}
        <span
          className="ml-auto px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold font-poppins"
          style={{ background: hasAnyAlert ? "#ef4444" : "#7C3AED" }}
        >
          {sortedClones.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-3">
        {sortedClones.map((clone) => {
          const alertTs = alertMap[String(clone.id)];
          return (
            <MiniCloneCard
              key={clone.id}
              clone={clone}
              onClick={onClickClone}
              selected={selectedType === "clone" && selectedId === clone.id}
              onStart={onStart}
              onStop={onStop}
              onDeleteRequest={onDeleteRequest}
              actionLoading={actionLoading}
              hasAlert={alertTs !== undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── AlertCloneCard ───────────────────────────────────────────────────────────
function AlertCloneCard({ clone, alertMap, onSelect }) {
  const isRunning = clone.running ?? clone.status === "running";
  const alertTs = alertMap[String(clone.id)];
  const modeMeta = MODE_META[clone.mode] ?? null;

  return (
    <div
      onClick={() => onSelect(clone.id)}
      className="relative flex flex-col rounded-xl cursor-pointer overflow-hidden bg-white flex-shrink-0 transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{
        width: "196px",
        border: "2px solid #ef4444",
        boxShadow:
          "0 0 0 2px rgba(239,68,68,0.28), 0 4px 16px rgba(0,0,0,0.10)",
        animation: "viqAlertBlink 1s ease-in-out infinite",
      }}
    >
      <div
        className="relative bg-[#0f172a] flex items-center justify-center overflow-hidden"
        style={{ height: "118px" }}
      >
        <LiveStreamView streamId={clone.camera_id} isRunning={isRunning} alt={clone.name} />
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Camera size={22} className="text-white" />
          </div>
        )}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 font-poppins text-[10px] font-bold text-white"
          style={{ background: "rgba(239,68,68,0.93)" }}
        >
          🚨 ALERT
        </div>
        <div
          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded font-poppins text-[8px] font-bold"
          style={{ background: "rgba(124,58,237,0.85)", color: "#fff" }}
        >
          CLONE
        </div>
        {modeMeta && (
          <div
            className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded font-poppins text-[8px] font-bold text-white"
            style={{ background: `${modeMeta.color}cc` }}
          >
            {modeMeta.label}
          </div>
        )}
        {isRunning && (
          <div
            className="absolute right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ top: "30px", background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="font-poppins text-[8px] font-bold text-white">
              REC
            </span>
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p
          className="font-poppins text-[12px] font-semibold truncate"
          style={{ color: "#023350" }}
        >
          {clone.name ?? `Clone ${clone.id}`}
        </p>
        {alertTs ? (
          <p className="font-poppins text-[10px] text-gray-400 font-mono mt-0.5">
            {new Date(alertTs).toLocaleTimeString()}
          </p>
        ) : (
          <p className="font-poppins text-[10px] text-gray-400 mt-0.5">
            Active alert
          </p>
        )}
      </div>
    </div>
  );
}

// ─── AlertSection ─────────────────────────────────────────────────────────────
function AlertSection({ alertClones, alertMap, onSelectClone }) {
  const [collapsed, setCollapsed] = useState(false);
  if (alertClones.length === 0) return null;

  return (
    <div className="flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="font-poppins text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "#ef4444" }}
        >
          🚨 Alerts
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-white text-[11px] font-bold font-poppins"
          style={{ background: "#ef4444" }}
        >
          {alertClones.length}
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(239,68,68,0.2)" }}
        />
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="font-poppins text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors hover:bg-red-50 flex-shrink-0"
          style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          {collapsed ? "▼ Show" : "▲ Hide"}
        </button>
      </div>
      {!collapsed && (
        <div
          className="flex flex-row gap-3 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#fca5a5 transparent",
          }}
        >
          {alertClones.map((clone) => (
            <AlertCloneCard
              key={clone.id}
              clone={clone}
              alertMap={alertMap}
              onSelect={onSelectClone}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CameraMinimap ────────────────────────────────────────────────────────────
// Compact sticky rail — thumbnail tiles when expanded, colour-coded dots when
// minimised. Clicking any tile/dot jumps to that camera row in the main list.
function CameraMinimap({
  cameras,
  clonesByCamera,
  alertMap,
  selectedId,
  selectedType,
  collapsedCams,
  onJump,
}: {
  cameras: any[];
  clonesByCamera: Record<string, any[]>;
  alertMap: Record<string, number>;
  selectedId: any;
  selectedType: string | null;
  collapsedCams: Set<any>;
  onJump: (id: any) => void;
}) {
  const scrollContainerRef = useRef(null);

  // Auto‑scroll the minimap so the selected camera’s name is visible
  useEffect(() => {
    if (!selectedId || !scrollContainerRef.current) return;

    let targetCamId = null;
    if (selectedType === "camera") {
      targetCamId = String(selectedId);
    } else if (selectedType === "clone") {
      for (const [camId, clones] of Object.entries(clonesByCamera)) {
        if (clones.some((c) => String(c.id) === String(selectedId))) {
          targetCamId = camId;
          break;
        }
      }
    }

    if (!targetCamId) return;

    // Wait until the page has finished scrolling (triggered by detail panel)
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      const btn = container?.querySelector(`[data-cam-id="${targetCamId}"]`);
      if (btn) {
        btn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, 100); // delay after the page’s own scroll

    return () => clearTimeout(timer);
  }, [selectedId, selectedType, clonesByCamera]);

  if (cameras.length === 0) return null;

  return (
    <aside className="hidden lg:block flex-shrink-0" style={{ width: "80px" }}>
      <div
        className="sticky top-2 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          maxHeight: "calc(100vh - 160px)",
        }}
      >
        <div
          className="flex items-center px-2 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <span
            className="font-poppins font-bold uppercase tracking-widest"
            style={{ fontSize: "8px", color: "#94a3b8" }}
          >
            CAM
          </span>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex flex-col overflow-y-auto"
          style={{ scrollbarWidth: "none", padding: "4px" }}
        >
          {cameras.map((cam, i) => {
            const isRunning = cam.running ?? cam.status === "running";
            const camClones = clonesByCamera[String(cam.id)] ?? [];
            const hasAlert = camClones.some((c) => cloneHasAlert(c, alertMap));
            const isSelected =
              (selectedType === "camera" && selectedId === cam.id) ||
              (selectedType === "clone" &&
                camClones.some((c) => c.id === selectedId));
            const isCollapsed = collapsedCams.has(cam.id);
            const cloneCount = camClones.length;

            const tooltip = [
              cam.name ?? `Camera ${i + 1}`,
              cloneCount > 0 && `${cloneCount} clone(s)`,
              hasAlert && "⚠ Alert",
              isCollapsed && "collapsed",
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <button
                key={cam.id}
                data-cam-id={String(cam.id)}
                onClick={() => onJump(cam.id)}
                title={tooltip}
                className="relative flex items-center gap-1 w-full text-left rounded py-1 px-1 transition-colors hover:bg-slate-50 focus:outline-none"
                style={{
                  background: isSelected
                    ? "rgba(0,133,212,0.08)"
                    : "transparent",
                  borderLeft: isSelected
                    ? "2px solid #0085D4"
                    : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                <span
                  className="flex-shrink-0 rounded-full"
                  style={{
                    width: "5px",
                    height: "5px",
                    background: hasAlert
                      ? "#ef4444"
                      : isRunning
                        ? "#22c55e"
                        : "#cbd5e1",
                    animation: hasAlert
                      ? "viqAlertBlink 1s ease-in-out infinite"
                      : "none",
                  }}
                />
                <span
                  className="font-poppins text-[10px] font-medium truncate"
                  style={{
                    color: isSelected ? "#023350" : "#475569",
                    fontWeight: isSelected ? 600 : 400,
                    lineHeight: 1.2,
                  }}
                >
                  {cam.name ?? `CAM ${i + 1}`}
                </span>
                {cloneCount > 0 && (
                  <span
                    className="ml-auto flex-shrink-0 text-white text-[7px] font-bold px-1 rounded-full"
                    style={{
                      background: hasAlert ? "#ef4444" : "#7C3AED",
                      lineHeight: "12px",
                      minWidth: "12px",
                      textAlign: "center",
                    }}
                  >
                    {cloneCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ─── CollapsibleCameraRow ─────────────────────────────────────────────────────
function CollapsibleCameraRow({
  cam,
  camIndex,
  camClones,
  collapsed,
  onToggle,
  rowRef,
  alertMap,
  selectedId,
  selectedType,
  onSelectCamera,
  onSelectClone,
  onStart,
  onStop,
  onUploadVideo,
  onCloneStart,
  onCloneStop,
  onDeleteCamera,
  onDeleteClone,
  onCloneRequest,
  camActionLoading,
  cloneActionLoading,
}) {
  const isRunning = cam.running ?? cam.status === "running";
  const hasAlert = (camClones ?? []).some((c) => cloneHasAlert(c, alertMap));

  return (
    <div
      ref={rowRef}
      className="rounded-2xl"
      style={{
        scrollMarginTop: "12px",
        border: hasAlert ? "1.5px solid #fca5a5" : "1px solid rgba(0,0,0,0.06)",
        background: "#ffffff",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header bar */}
      <button
        onClick={() => onToggle(cam.id)}
        className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl transition-colors hover:bg-slate-50"
        style={{ background: hasAlert ? "#fef2f2" : "transparent" }}
      >
        <span
          className="flex items-center justify-center w-5 h-5 rounded-md flex-shrink-0 transition-transform"
          style={{
            color: "#64748b",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </span>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: isRunning ? "#22c55e" : "#cbd5e1" }}
        />
        <span
          className="font-poppins text-[13px] font-semibold truncate"
          style={{ color: "#023350" }}
        >
          {cam.name ?? `Camera ${camIndex + 1}`}
        </span>
        {isRunning && (
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold font-poppins flex-shrink-0"
            style={{ background: "rgba(194,24,7,0.85)" }}
          >
            <span className="w-1 h-1 rounded-full bg-white inline-block animate-pulse" />
            REC
          </span>
        )}
        <div className="flex-1" />
        {hasAlert && (
          <span
            className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold font-poppins flex-shrink-0"
            style={{ background: "#ef4444" }}
          >
            🚨 Alert
          </span>
        )}
        {(camClones?.length ?? 0) > 0 && (
          <span
            className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold font-poppins flex-shrink-0"
            style={{ background: "#7C3AED" }}
          >
            {camClones.length} {camClones.length === 1 ? "Clone" : "Clones"}
          </span>
        )}
        <span
          className="font-poppins text-[11px] font-medium flex-shrink-0 hidden sm:inline"
          style={{ color: "#94a3b8" }}
        >
          {collapsed ? "Expand" : "Collapse"}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="flex gap-4 items-stretch px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex-1 min-w-0">
            <CameraCard
              cam={cam}
              camIndex={camIndex}
              onClick={onSelectCamera}
              selected={selectedType === "camera" && selectedId === cam.id}
              onStart={onStart}
              onStop={onStop}
              onUploadVideo={onUploadVideo}
              onDeleteRequest={onDeleteCamera}
              onCloneRequest={onCloneRequest}
              actionLoading={camActionLoading}
            />
          </div>
          <div className="w-full lg:w-[45%] flex-shrink-0">
            {camClones?.length > 0 ? (
              <CloneGroup
                camera={cam}
                clones={camClones}
                alertMap={alertMap}
                selectedId={selectedId}
                selectedType={selectedType}
                onClickClone={onSelectClone}
                onStart={onCloneStart}
                onStop={onCloneStop}
                onDeleteRequest={onDeleteClone}
                actionLoading={cloneActionLoading}
              />
            ) : (
              <div
                className="rounded-xl h-full flex flex-col items-center justify-center gap-2 py-8"
                style={{
                  border: "1px dashed #cbd5e1",
                  background: "#fafbfc",
                  minHeight: "160px",
                }}
              >
                <Copy size={20} className="text-gray-300" />
                <span className="font-poppins text-[12px] text-gray-400">
                  No clones yet
                </span>
                <button
                  onClick={() => onCloneRequest(cam)}
                  className="font-poppins text-[11px] font-medium px-3 py-1 rounded-full transition-colors hover:bg-blue-50"
                  style={{
                    color: "#0085D4",
                    border: "1px solid rgba(0,133,212,0.3)",
                  }}
                >
                  + Add Clone
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CameraGrid (main) ────────────────────────────────────────────────────────
export default function CameraGrid({
  onRefetchReady,
  onClonesChange,
  selectedMode,
}) {
  const {
    cameras,
    loading: camLoading,
    error: camError,
    refetch: refetchCameras,
    handleStart: handleCamStart,
    handleStop: handleCamStop,
    handleDelete: handleCamDelete,
    handleUploadVideo: handleCamUploadVideo,
    restartFromStart: handleCamRestartFromStart,
  } = useCameras(5000);

  const {
    clones,
    refetch: refetchClones,
    handleStart: handleCloneStart,
    handleStop: handleCloneStop,
    handleDelete: handleCloneDelete,
  } = useClones(5000);

  const { alerts } = useAlerts({}, 5000);

  const alertMap = useMemo(() => {
    const map = {};
    alerts.forEach((a) => {
      if (a.acknowledged) return;
      const cloneId = String(a.camera_id ?? a.camId ?? "");
      if (!cloneId) return;
      const ts = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (!map[cloneId] || ts > map[cloneId]) map[cloneId] = ts;
    });
    return map;
  }, [alerts]);

  const sortedClones = useMemo(() => {
    const withAlert = [];
    const withoutAlert = [];
    clones.forEach((c) =>
      cloneHasAlert(c, alertMap) ? withAlert.push(c) : withoutAlert.push(c),
    );
    withAlert.sort(
      (a, b) => (alertMap[String(b.id)] ?? 0) - (alertMap[String(a.id)] ?? 0),
    );
    return [...withAlert, ...withoutAlert];
  }, [clones, alertMap]);

  const alertClones = useMemo(
    () => sortedClones.filter((c) => cloneHasAlert(c, alertMap)),
    [sortedClones, alertMap],
  );

  const clonesByCamera = useMemo(() => {
    const groups = {};
    clones.forEach((clone) => {
      const camId = String(
        clone.camera_id ?? clone.source_camera_id ?? clone.cam_id ?? "unknown",
      );
      if (!groups[camId]) groups[camId] = [];
      groups[camId].push(clone);
    });
    return groups;
  }, [clones]);

  const hasAnyClones = clones.length > 0;

  useEffect(() => {
    onClonesChange?.(clones.length);
  }, [clones.length, onClonesChange]);

  const [collapsedCams, setCollapsedCams] = useState(new Set());
  const camRowRefs = useRef({});

  const toggleCam = (id) =>
    setCollapsedCams((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const collapseAll = () => setCollapsedCams(new Set(cameras.map((c) => c.id)));
  const expandAll = () => setCollapsedCams(new Set());
  const allCollapsed =
    cameras.length > 0 && collapsedCams.size >= cameras.length;

  const jumpToCamera = (id) => {
    setCollapsedCams((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    requestAnimationFrame(() => {
      camRowRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const selectedCam =
    selectedType === "camera"
      ? (cameras.find((c) => c.id === selectedId) ?? null)
      : null;
  const selectedClone =
    selectedType === "clone"
      ? (clones.find((c) => c.id === selectedId) ?? null)
      : null;

  const detailPanelRef = useRef(null);

  // Selecting a mode from the dropdown jumps straight to its clone (if one
  // exists) and shows it in the camera view — starting it first if it's
  // currently stopped, instead of only picking from already-running clones.
  const autoStartedCloneId = useRef(null);

  useEffect(() => {
    if (!selectedMode) {
      autoStartedCloneId.current = null;
      return;
    }
    const modeId = MODE_MAP[selectedMode];
    if (!modeId) return;
    const matchingClone = clones.find((c) => {
      const nameMatch =
        c.mode === modeId ||
        c.name?.toLowerCase().includes(modeId.replace(/_/g, " ")) ||
        c.name?.toLowerCase().includes(modeId);
      return nameMatch;
    });
    if (!matchingClone) return;

    setSelectedId(matchingClone.id);
    setSelectedType("clone");

    const isRunning =
      matchingClone.running ?? matchingClone.status === "running";
    if (!isRunning && autoStartedCloneId.current !== matchingClone.id) {
      autoStartedCloneId.current = matchingClone.id;
      doCloneStart(matchingClone.id);
    }
  }, [selectedMode, clones]);

  useEffect(() => {
    if ((selectedCam || selectedClone) && detailPanelRef.current) {
      detailPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedId]);

  const [camActionLoading, setCamActionLoading] = useState(new Set());
  const [cloneActionLoading, setCloneActionLoading] = useState(new Set());

  const addCam = (id) => setCamActionLoading((p) => new Set(p).add(id));
  const removeCam = (id) =>
    setCamActionLoading((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });

  async function doStart(id) {
    addCam(id);
    try {
      await handleCamStart(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCam(id);
    }
  }
  async function doStop(id) {
    addCam(id);
    try {
      await handleCamStop(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCam(id);
    }
  }

  async function doUploadVideo(id, file) {
    addCam(id);
    try {
      await handleCamUploadVideo(id, file);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeCam(id);
    }
  }

  const addClone = (id) => setCloneActionLoading((p) => new Set(p).add(id));
  const removeClone = (id) =>
    setCloneActionLoading((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });

  // Enabling a module attaches it directly to the stream — no separate
  // source/session to choose, unlike the old backend.
  async function doCloneStart(id) {
    addClone(id);
    try {
      await handleCloneStart(id);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeClone(id);
    }
  }

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  function requestDelete(item, type) {
    setDeleteTarget({ item, type });
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const { item, type } = deleteTarget;
    try {
      if (selectedId === item.id) {
        setSelectedId(null);
        setSelectedType(null);
      }
      if (type === "camera") await handleCamDelete(item.id);
      else await handleCloneDelete(item.id);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  const [cloneSource, setCloneSource] = useState(null);

  async function onCloneCreated() {
    setCloneSource(null);
    await refetchClones();
  }

  useEffect(() => {
    onRefetchReady?.(refetchCameras);
  }, [refetchCameras, onRefetchReady]);

  if (camLoading && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RefreshCw size={28} className="animate-spin" />
          <p className="font-poppins text-sm">Loading cameras…</p>
        </div>
      </div>
    );
  }
  if (camError && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">⚠️</span>
          <p className="font-poppins text-sm text-red-400">{camError}</p>
        </div>
      </div>
    );
  }
  if (!camLoading && cameras.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Camera size={36} className="opacity-30" />
          <p className="font-poppins text-sm">No cameras added yet</p>
          <p className="font-poppins text-xs">
            Click "Add Camera" to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 pb-2">
      {/* Modals */}
      {cloneSource && (
        <CloneModal
          cam={cloneSource}
          onClose={() => setCloneSource(null)}
          onCreated={onCloneCreated}
          onBeforeEnable={handleCamRestartFromStart}
        />
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "clone" ? "Clone" : "Camera"}`}
        message={`Remove "${deleteTarget?.item?.name ?? deleteTarget?.item?.id}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      {deleteError && (
        <div className="rounded-lg px-4 py-2 font-poppins text-[12px] text-red-500 bg-red-50 border border-red-200 flex-shrink-0">
          ⚠️ {deleteError}
        </div>
      )}

      {/* ── Detail panel: selected camera ── */}
      {selectedCam && (
        <div
          ref={detailPanelRef}
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-[55%] flex-shrink-0">
              <div className="p-3 sm:p-4">
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video min-h-[420px] sm:min-h-[480px]">
                  <LiveStreamView
                    streamId={selectedCam.id}
                    isRunning={
                      selectedCam.running ?? selectedCam.status === "running"
                    }
                    alt="Live stream"
                  />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded text-white text-sm font-medium font-poppins"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {selectedCam.name ?? selectedCam.id}
                  </div>
                  {(selectedCam.running ??
                    selectedCam.status === "running") && (
                      <div
                        className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-sm font-bold flex items-center gap-1 font-poppins"
                        style={{ background: "rgba(194,24,7,0.85)" }}
                      >
                        <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
                        LIVE
                      </div>
                    )}
                </div>
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3"
                style={{ borderTop: "1px solid #E8EFF5" }}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Camera ID:{" "}
                    <span style={{ color: "#0085D4" }}>{selectedCam.id}</span>
                  </p>
                  {selectedCam.transport && (
                    <>
                      <span className="hidden sm:block text-gray-300">|</span>
                      <p
                        className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                        style={{ color: "#023350" }}
                      >
                        Type:{" "}
                        <span
                          className="font-normal"
                          style={{ color: "#4A4A4A" }}
                        >
                          {selectedCam.transport}
                        </span>
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedType(null);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
                  style={{ background: "#ef4444" }}
                >
                  <X size={16} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Detection status for whichever models are attached to this
                camera — same left-video/right-status layout as the Clone
                view, so you don't have to click into a separate Clone
                entry just to see it. If none are enabled yet, show a way
                to enable one right here instead of leaving this blank. */}
            <div
              className="flex-1 flex flex-col divide-y"
              style={{ borderLeft: "1px solid #E8EFF5" }}
            >
              {(selectedCam.active_modules ?? []).length > 0 ? (
                selectedCam.active_modules.map((mode) => (
                  <RightPanel
                    key={mode}
                    mode={mode}
                    streamId={selectedCam.id}
                  />
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="text-2xl">📡</span>
                  <p className="font-poppins text-[13px] text-gray-500">
                    No detection model enabled on this camera yet.
                  </p>
                  <button
                    onClick={() => setCloneSource(selectedCam)}
                    className="px-4 py-2 rounded-lg font-poppins text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "#0085D4" }}
                  >
                    Enable Detection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail panel: selected clone ── */}
      {selectedClone && (
        <div
          ref={detailPanelRef}
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(124,58,237,0.20)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            <div className="w-full lg:w-[55%] flex-shrink-0">
              <div className="p-3 sm:p-4">
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video min-h-[420px] sm:min-h-[480px]">
                  <LiveStreamView
                    streamId={selectedClone.camera_id}
                    isRunning={
                      selectedClone.running ??
                      selectedClone.status === "running"
                    }
                    alt={selectedClone.name}
                  />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded text-white text-sm font-medium font-poppins"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    {selectedClone.name ?? selectedClone.id}
                  </div>
                  <div
                    className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold font-poppins"
                    style={{
                      background: "rgba(124,58,237,0.75)",
                      color: "#fff",
                    }}
                  >
                    CLONE
                  </div>
                  {(selectedClone.running ??
                    selectedClone.status === "running") && (
                      <div
                        className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-sm font-bold flex items-center gap-1 font-poppins"
                        style={{ background: "rgba(194,24,7,0.85)" }}
                      >
                        <span className="w-2 h-2 rounded-full bg-white inline-block animate-pulse" />
                        LIVE
                      </div>
                    )}
                </div>
              </div>
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3"
                style={{ borderTop: "1px solid #E8EFF5" }}
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Clone ID:{" "}
                    <span style={{ color: "#7C3AED" }}>{selectedClone.id}</span>
                  </p>
                  <span className="hidden sm:block text-gray-300">|</span>
                  <p
                    className="font-poppins text-[12px] sm:text-[13px] font-semibold"
                    style={{ color: "#023350" }}
                  >
                    Mode:{" "}
                    <span className="font-normal" style={{ color: "#4A4A4A" }}>
                      {selectedClone.name ?? "—"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedType(null);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
                  style={{ background: "#ef4444" }}
                >
                  <X size={16} color="#ffffff" />
                </button>
              </div>
            </div>
            <RightPanel
              mode={selectedClone.mode}
              streamId={selectedClone.camera_id}
            />
          </div>
        </div>
      )}

      {/* ── ALERTS ── */}
      <AlertSection
        alertClones={alertClones}
        alertMap={alertMap}
        onSelectClone={(id) => {
          setSelectedId(id);
          setSelectedType("clone");
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          CAMERAS + MINIMAP RAIL
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-4 flex-1 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Section header */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="font-poppins text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: "#0085D4" }}
            >
              Cameras
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-white text-[11px] font-bold font-poppins"
              style={{ background: "#0085D4" }}
            >
              {cameras.length}
            </span>
            {hasAnyClones && (
              <>
                <span
                  className="ml-1 font-poppins text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: "#7C3AED" }}
                >
                  Clones
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-white text-[11px] font-bold font-poppins"
                  style={{ background: "#7C3AED" }}
                >
                  {clones.length}
                </span>
              </>
            )}
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(0,133,212,0.18)" }}
            />
            <button
              onClick={allCollapsed ? expandAll : collapseAll}
              className="font-poppins text-[11px] font-medium px-3 py-1 rounded-full transition-colors hover:bg-blue-50 flex-shrink-0"
              style={{
                color: "#0085D4",
                border: "1px solid rgba(0,133,212,0.3)",
              }}
            >
              {allCollapsed ? "▾ Expand all" : "▸ Collapse all"}
            </button>
          </div>

          {/* One collapsible row per camera */}
          {cameras.map((cam, i) => (
            <CollapsibleCameraRow
              key={cam.id}
              cam={cam}
              camIndex={i}
              camClones={clonesByCamera[String(cam.id)]}
              collapsed={collapsedCams.has(cam.id)}
              onToggle={toggleCam}
              rowRef={(el) => (camRowRefs.current[cam.id] = el)}
              alertMap={alertMap}
              selectedId={selectedId}
              selectedType={selectedType}
              onSelectCamera={(id) => {
                setSelectedId(id);
                setSelectedType("camera");
              }}
              onSelectClone={(id) => {
                setSelectedId(id);
                setSelectedType("clone");
              }}
              onStart={doStart}
              onStop={doStop}
              onUploadVideo={doUploadVideo}
              onCloneStart={doCloneStart}
              onCloneStop={handleCloneStop}
              onDeleteCamera={(c) => requestDelete(c, "camera")}
              onDeleteClone={(c) => requestDelete(c, "clone")}
              onCloneRequest={setCloneSource}
              camActionLoading={camActionLoading}
              cloneActionLoading={cloneActionLoading}
            />
          ))}

          {/* Orphan clones */}
          {clonesByCamera["unknown"]?.length > 0 && (
            <div
              className="rounded-2xl p-3 sm:p-4"
              style={{
                border: "1px solid rgba(0,0,0,0.06)",
                background: "#ffffff",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}
            >
              <CloneGroup
                camera={{ id: "unknown", name: "Other Clones" }}
                clones={clonesByCamera["unknown"]}
                alertMap={alertMap}
                selectedId={selectedId}
                selectedType={selectedType}
                onClickClone={(id) => {
                  setSelectedId(id);
                  setSelectedType("clone");
                }}
                onStart={doCloneStart}
                onStop={handleCloneStop}
                onDeleteRequest={(c) => requestDelete(c, "clone")}
                actionLoading={cloneActionLoading}
              />
            </div>
          )}
        </div>

        {/* Minimap rail */}
        <CameraMinimap
          cameras={cameras}
          clonesByCamera={clonesByCamera}
          alertMap={alertMap}
          selectedId={selectedId}
          selectedType={selectedType}
          collapsedCams={collapsedCams}
          onJump={jumpToCamera}
        />
      </div>
    </div>
  );
}