import { useState, useEffect, useRef, useMemo } from "react";
import { Camera, X, Play, Square, Trash2, RefreshCw, Copy } from "lucide-react";
import { useCameras } from "../../hooks/useCameras";
import { useClones } from "../../hooks/useClones";
import { useAlerts } from "../../hooks/useAlerts";
import { useDetectionEvents } from "../../hooks/useDetectionEvents";
import { getCameraStreamUrl, getCameraSnapshotUrl } from "../../api/cameras";
import {
  getCloneStreamUrl,
  getCloneSnapshotUrl,
  startClone,
  getCloneStatus,
} from "../../api/clones";
import {
  startFireRtsp,
  getFireRtspStreamUrl,
  getFireRtspStatus,
  listFireRtspSessions,
  stopFireRtspAlert,
  stopFireRtspSession,
} from "../../api/fire";
import sirenSrc from "../../assets/Siren1.mp3";
import ConfirmModal from "../shared/ConfirmModal";
import CloneModal from "./CloneModal";
import helmetImg from "../../assets/helmet.png";
import gogglesImg from "../../assets/googles.png";
import armSleevesImg from "../../assets/armsleeces.png";
import handGlovesImg from "../../assets/handgloves.png";
import vestImg from "../../assets/vest.png";
import shoesImg from "../../assets/shoes.png";

const PPE_ITEMS = [
  { id: "helmet", label: "Helmet", img: helmetImg },
  { id: "goggles", label: "Goggles", img: gogglesImg },
  { id: "arm_sleeves", label: "Arm Sleeves", img: armSleevesImg },
  { id: "hand_gloves", label: "Hand Gloves", img: handGlovesImg },
  { id: "vest", label: "Vest", img: vestImg },
  { id: "shoes", label: "Shoes", img: shoesImg },
];

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

// ─── StreamThumb ─────────────────────────────────────────────────────────────
function StreamThumb({ snapshotUrl, isRunning, alt, startDelay = 0 }) {
  const imgRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!isRunning) {
      setHasFirstFrame(false);
      if (imgRef.current) imgRef.current.src = "";
      return;
    }
    function loadNext() {
      const url = `${snapshotUrl}?t=${Date.now()}`;
      const fetchStart = Date.now();
      const img = new Image();
      img.onload = () => {
        if (!mountedRef.current) return;
        if (imgRef.current) imgRef.current.src = url;
        setHasFirstFrame(true);
        const elapsed = Date.now() - fetchStart;
        timerRef.current = setTimeout(loadNext, Math.max(800, 1200 - elapsed));
      };
      img.onerror = () => {
        if (!mountedRef.current) return;
        timerRef.current = setTimeout(loadNext, 2000);
      };
      img.src = url;
    }
    timerRef.current = setTimeout(loadNext, startDelay);
    return () => clearTimeout(timerRef.current);
  }, [isRunning, snapshotUrl, startDelay]);

  if (!isRunning) return null;
  return (
    <img
      ref={imgRef}
      alt={alt}
      className="w-full h-full object-cover"
      style={{ opacity: hasFirstFrame ? 1 : 0 }}
    />
  );
}

// ─── CloneThumb ───────────────────────────────────────────────────────────────
// Fire clones are backed by the standalone Fire microservice (job_id, MJPEG
// stream) instead of Main backend's generic clone snapshot polling.
function CloneThumb({ clone, jobId, isRunning, alt }) {
  if (clone.mode === "fire") {
    if (!isRunning || !jobId) return null;
    return (
      <img
        key={jobId}
        src={getFireRtspStreamUrl(jobId)}
        alt={alt}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <StreamThumb
      isRunning={isRunning}
      snapshotUrl={getCloneSnapshotUrl(clone.id)}
      alt={alt}
    />
  );
}

// ─── Fire siren ───────────────────────────────────────────────────────────────
function useFireSiren(triggered, muted) {
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

// ─── FirePanel ─────────────────────────────────────────────────────────────────
function FirePanel({ jobId }) {
  const [status, setStatus] = useState(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!jobId) return;
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
  }, [jobId]);

  const fire = !!(status?.fire_detected ?? status?.fire ?? status?.detected);
  const smoke = !!(status?.smoke_detected ?? status?.smoke);
  const isAlert = fire || smoke;
  const audioRef = useFireSiren(isAlert, muted);

  return (
    <div
      className="flex-1 p-4 sm:p-5"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <audio ref={audioRef} src={sirenSrc} preload="auto" />
      <h3
        className="font-poppins text-[14px] sm:text-[15px] font-semibold mb-4"
        style={{ color: "#023350" }}
      >
        Fire Status
      </h3>

      {!jobId ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <span className="text-2xl mb-1">📡</span>
          <span className="font-poppins text-[12px]">
            Start this clone to begin monitoring
          </span>
        </div>
      ) : (
        <>
          <div
            className="p-3 rounded-lg text-center font-poppins text-[13px] font-semibold mb-3"
            style={
              isAlert
                ? {
                    background: "#fef2f2",
                    color: "#ef4444",
                    border: "1px solid #fca5a5",
                  }
                : {
                    background: "#f0fdf4",
                    color: "#22c55e",
                    border: "1px solid #86efac",
                  }
            }
          >
            {isAlert
              ? `🔥 ${fire ? "FIRE" : ""} ${smoke ? "SMOKE" : ""} DETECTED`
              : "✅ No Fire / Smoke Detected"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted((m) => !m)}
              className="flex-1 py-2 rounded-lg font-poppins text-[12px] font-bold border transition-all"
              style={
                muted
                  ? {
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#94a3b8",
                    }
                  : isAlert
                    ? {
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#ef4444",
                      }
                    : {
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        color: "#22c55e",
                      }
              }
            >
              {muted ? "🔇 MUTED" : isAlert ? "🔊 SIREN ON" : "🔊 SIREN"}
            </button>
            {isAlert && (
              <button
                onClick={() => stopFireRtspAlert(jobId).catch(() => {})}
                className="flex-1 py-2 rounded-lg font-poppins text-[12px] font-bold border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                Stop Alert
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PPEPanel ─────────────────────────────────────────────────────────────────
function PPEPanel() {
  return (
    <div
      className="flex-1 p-4 sm:p-5"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <h3
        className="font-poppins text-[14px] sm:text-[15px] font-semibold mb-4"
        style={{ color: "#023350" }}
      >
        PPE Status
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {PPE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-xl"
            style={{
              border: "2px solid #22c55e",
              background: "#f0fdf4",
              minHeight: "110px",
            }}
          >
            <img
              src={item.img}
              alt={item.label}
              className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
            />
            <span
              className="font-poppins text-[11px] sm:text-[13px] font-medium text-center leading-tight"
              style={{ color: "#15803d" }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-4 p-2.5 rounded-lg text-center font-poppins text-[12px] sm:text-[13px] font-semibold"
        style={{
          background: "#f0fdf4",
          color: "#22c55e",
          border: "1px solid #86efac",
        }}
      >
        ✅ All PPE Compliant
      </div>
    </div>
  );
}

// ─── CrowdPanel ──────────────────────────────────────────────────────────────
function CrowdPanel({ clone }) {
  const [crowdData, setCrowdData] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (!clone?.id) return;
    async function poll() {
      try {
        const res = await getCloneStatus(clone.id);
        const payload = res?.latest_payload;
        if (payload?.crowd_alert) setCrowdData(payload.crowd_alert);
        if (payload?.image)
          setImgSrc(`data:image/jpeg;base64,${payload.image}`);
      } catch (_) {}
    }
    const init = clone?.latest_payload;
    if (init?.crowd_alert) setCrowdData(init.crowd_alert);
    if (init?.image) setImgSrc(`data:image/jpeg;base64,${init.image}`);
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [clone?.id]);

  const count = crowdData?.person_count ?? 0;
  const limit = crowdData?.crowd_limit ?? 10;
  const alert = crowdData?.confirmed === true && crowdData?.active === true;
  const pct = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;

  return (
    <div
      className="flex-1 p-4 sm:p-5"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <h3
        className="font-poppins text-[14px] sm:text-[15px] font-semibold mb-4"
        style={{ color: "#023350" }}
      >
        Crowd Status
      </h3>
      <div className="flex items-center gap-6 mb-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Current
          </span>
          <span
            className="text-5xl font-black"
            style={{ color: alert ? "#ef4444" : "#0085D4" }}
          >
            {count}
          </span>
          <span className="text-xs text-gray-400">people</span>
        </div>
        <div className="w-px h-16 bg-gray-200" />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Limit
          </span>
          <span className="text-5xl font-black text-gray-500">{limit}</span>
          <span className="text-xs text-gray-400">max</span>
        </div>
        <div className="w-px h-16 bg-gray-200" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Occupancy</span>
            <span style={{ color: alert ? "#ef4444" : "#0085D4" }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: alert
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : "linear-gradient(90deg,#0085D4,#024167)",
              }}
            />
          </div>
        </div>
      </div>
      <div
        className="p-2.5 rounded-lg text-center font-poppins text-[13px] font-semibold"
        style={
          alert
            ? {
                background: "#fef2f2",
                color: "#ef4444",
                border: "1px solid #fca5a5",
              }
            : {
                background: "#f0fdf4",
                color: "#22c55e",
                border: "1px solid #86efac",
              }
        }
      >
        {alert ? `🚨 Overcrowded! (${count} / ${limit})` : "✅ Normal"}
      </div>
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Crowd snapshot"
          className="mt-3 w-full rounded-xl object-cover"
          style={{ maxHeight: 160 }}
        />
      )}
    </div>
  );
}

// ─── DetectionEventsPanel ────────────────────────────────────────────────────
function DetectionEventsPanel({ mode }) {
  const { events, loading } = useDetectionEvents(mode, true);
  const meta = MODE_META[mode] ?? { label: mode, color: "#0085D4" };
  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ borderTop: "1px solid #E8EFF5", background: "#ffffff" }}
    >
      <div className="px-4 sm:px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
        <h3
          className="font-poppins text-[14px] sm:text-[15px] font-semibold"
          style={{ color: "#023350" }}
        >
          {meta.label} Events
        </h3>
        {loading && (
          <RefreshCw
            size={13}
            className="animate-spin"
            style={{ color: meta.color }}
          />
        )}
        <span
          className="font-poppins text-[11px] px-2 py-0.5 rounded-full text-white font-bold"
          style={{ background: meta.color }}
        >
          {events.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4 flex flex-col gap-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <span className="text-2xl mb-1">📋</span>
            <span className="font-poppins text-[12px]">No events yet</span>
          </div>
        ) : (
          events.map((ev, i) => (
            <EventCard
              key={ev.id ?? ev.event_id ?? i}
              event={ev}
              color={meta.color}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── EventCard ───────────────────────────────────────────────────────────────
function EventCard({ event, color }) {
  const [expanded, setExpanded] = useState(false);
  const time = event.timestamp ?? event.created_at ?? event.time ?? null;
  const label =
    event.label ?? event.animal ?? event.type ?? event.event_type ?? "Event";
  const confidence =
    event.confidence != null ? `${(event.confidence * 100).toFixed(1)}%` : null;
  const camId = event.camera_id ?? event.cam_id ?? null;
  const imgData = event.image ?? event.annotated ?? null;
  const imgSrc = imgData
    ? imgData.startsWith("data:")
      ? imgData
      : `data:image/jpeg;base64,${imgData}`
    : null;

  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2 flex-shrink-0"
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span
            className="font-poppins text-[12px] font-semibold truncate"
            style={{ color: "#023350" }}
          >
            {String(label).toUpperCase()}
          </span>
          {confidence && (
            <span className="font-poppins text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {confidence}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {camId && (
            <span className="font-poppins text-[10px] text-gray-400">
              CAM {camId}
            </span>
          )}
          {time && (
            <span className="font-poppins text-[10px] text-gray-400 font-mono">
              {new Date(time).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      {imgSrc && (
        <img
          src={imgSrc}
          alt="detection"
          className="w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          style={{ maxHeight: "120px" }}
          onClick={() => setExpanded((p) => !p)}
        />
      )}
      {expanded && imgSrc && (
        <img
          src={imgSrc}
          alt="full"
          className="w-full rounded-lg object-cover"
        />
      )}
    </div>
  );
}

// ─── RightPanel ──────────────────────────────────────────────────────────────
function RightPanel({ mode, clone, fireJobId }) {
  if (!mode || mode === "ppe") return <PPEPanel />;
  if (mode === "crowd") return <CrowdPanel clone={clone} />;
  if (mode === "fire") return <FirePanel jobId={fireJobId} />;
  return <DetectionEventsPanel mode={mode} />;
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
  onDeleteRequest,
  onCloneRequest,
  actionLoading,
}) {
  const isRunning = cam.running ?? cam.status === "running";
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

      <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden flex-1 min-h-[160px]">
        <StreamThumb
          isRunning={isRunning}
          snapshotUrl={getCameraSnapshotUrl(cam.id)}
          alt={cam.name}
          startDelay={camIndex * 400}
        />
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
              {cam.source_type ?? "—"}
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
  jobId,
  onClick,
  selected,
  onStart,
  onStop,
  onDeleteRequest,
  actionLoading,
  hasAlert,
  alertTime,
}) {
  const isRunning = clone.running ?? clone.status === "running";
  const crowdAlert =
    clone.mode === "crowd" ? clone.latest_payload?.crowd_alert : null;
  const isCrowdAlert =
    crowdAlert?.confirmed === true && crowdAlert?.active === true;
  const showAlert = hasAlert || isCrowdAlert;

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
        <CloneThumb
          clone={clone}
          jobId={jobId}
          isRunning={isRunning}
          alt={clone.name}
        />
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
            🚨{" "}
            {isCrowdAlert
              ? `${crowdAlert.person_count}/${crowdAlert.crowd_limit}`
              : "ALERT"}
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
          className="font-poppins text-[11px] font-semibold truncate min-w-0"
          style={{ color: selected ? "#7C3AED" : "#023350" }}
          title={clone.name ?? `Clone ${clone.id}`}
        >
          {clone.name ?? `Clone ${clone.id}`}
        </span>
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => (isRunning ? onStop(clone.id) : onStart(clone.id))}
            disabled={actionLoading.has(clone.id)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
            style={{ background: isRunning ? "#ef4444" : "#22c55e" }}
          >
            {actionLoading.has(clone.id) ? (
              <RefreshCw size={9} className="animate-spin" />
            ) : isRunning ? (
              <Square size={9} />
            ) : (
              <Play size={9} />
            )}
          </button>
          <button
            onClick={() => onDeleteRequest(clone)}
            className="w-5 h-5 flex items-center justify-center hover:opacity-70"
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
  fireJobs,
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
              jobId={fireJobs?.[clone.id]}
              onClick={onClickClone}
              selected={selectedType === "clone" && selectedId === clone.id}
              onStart={onStart}
              onStop={onStop}
              onDeleteRequest={onDeleteRequest}
              actionLoading={actionLoading}
              hasAlert={alertTs !== undefined}
              alertTime={alertTs ? new Date(alertTs).toISOString() : null}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── AlertCloneCard ───────────────────────────────────────────────────────────
function AlertCloneCard({ clone, jobId, alertMap, onSelect }) {
  const isRunning = clone.running ?? clone.status === "running";
  const alertTs = alertMap[String(clone.id)];
  const crowdAlert =
    clone.mode === "crowd" ? clone.latest_payload?.crowd_alert : null;
  const isCrowdAlert =
    crowdAlert?.confirmed === true && crowdAlert?.active === true;
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
        <CloneThumb
          clone={clone}
          jobId={jobId}
          isRunning={isRunning}
          alt={clone.name}
        />
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
          {isCrowdAlert && (
            <span className="font-normal opacity-90">
              · {crowdAlert.person_count}/{crowdAlert.crowd_limit} people
            </span>
          )}
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
        {isCrowdAlert ? (
          <p
            className="font-poppins text-[10px] font-semibold mt-0.5"
            style={{ color: "#ef4444" }}
          >
            {crowdAlert.person_count} people / limit {crowdAlert.crowd_limit}
          </p>
        ) : alertTs ? (
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
function AlertSection({ alertClones, fireJobs, alertMap, onSelectClone }) {
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
              jobId={fireJobs?.[clone.id]}
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
  hasAnyClones,
  fireJobs,
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
              onDeleteRequest={onDeleteCamera}
              onCloneRequest={onCloneRequest}
              actionLoading={camActionLoading}
            />
          </div>
          {hasAnyClones && (
            <div className="w-full lg:w-[45%] flex-shrink-0">
              {camClones?.length > 0 && (
                <CloneGroup
                  camera={cam}
                  clones={camClones}
                  fireJobs={fireJobs}
                  alertMap={alertMap}
                  selectedId={selectedId}
                  selectedType={selectedType}
                  onClickClone={onSelectClone}
                  onStart={onCloneStart}
                  onStop={onCloneStop}
                  onDeleteRequest={onDeleteClone}
                  actionLoading={cloneActionLoading}
                />
              )}
            </div>
          )}
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

  // ─── Fire clones: cloneId → Fire microservice job_id ────────────────────────
  // The Fire backend is a standalone microservice keyed by job_id, independent
  // of Main backend's clone registry, so we keep our own mapping for it.
  const [fireJobs, setFireJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fireCloneJobs") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("fireCloneJobs", JSON.stringify(fireJobs));
  }, [fireJobs]);

  // Drop any persisted job_ids that died on the backend (e.g. after a reload).
  useEffect(() => {
    if (Object.keys(fireJobs).length === 0) return;
    listFireRtspSessions()
      .then((sessions) => {
        const list = Array.isArray(sessions)
          ? sessions
          : (sessions?.sessions ?? []);
        const alive = new Set(
          list
            .filter((s) => s.status !== "error")
            .map((s) => String(s.job_id ?? s.id)),
        );
        setFireJobs((prev) => {
          const next = {};
          let changed = false;
          for (const [cloneId, jobId] of Object.entries(prev)) {
            if (alive.has(String(jobId))) next[cloneId] = jobId;
            else changed = true;
          }
          return changed ? next : prev;
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureFireSession(clone) {
    if (fireJobs[clone.id]) return fireJobs[clone.id];
    const camId = String(
      clone.camera_id ?? clone.source_camera_id ?? clone.cam_id ?? "",
    );
    const cam = cameras.find((c) => String(c.id) === camId);
    const rtspUrl = cam?.source;
    if (!rtspUrl) {
      console.error("Fire clone has no camera RTSP source to monitor.");
      return null;
    }
    try {
      const res = await startFireRtsp(rtspUrl, cam?.name ?? clone.name);
      const jobId = res.job_id ?? res.id;
      if (jobId) setFireJobs((prev) => ({ ...prev, [clone.id]: jobId }));
      return jobId ?? null;
    } catch (e) {
      console.error("Fire RTSP start failed:", e.message);
      return null;
    }
  }

  async function endFireSession(clone) {
    const jobId = fireJobs[clone.id];
    if (!jobId) return;
    setFireJobs((prev) => {
      const next = { ...prev };
      delete next[clone.id];
      return next;
    });
    try {
      await stopFireRtspSession(jobId);
    } catch (_) {}
  }

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

  useEffect(() => {
    if (!selectedMode) return;
    const modeId = MODE_MAP[selectedMode];
    if (!modeId) return;
    const matchingClone = clones.find((c) => {
      const isRunning = c.running ?? c.status === "running";
      const nameMatch =
        c.mode === modeId ||
        c.name?.toLowerCase().includes(modeId.replace(/_/g, " ")) ||
        c.name?.toLowerCase().includes(modeId);
      return isRunning && nameMatch;
    });
    if (matchingClone) {
      setSelectedId(matchingClone.id);
      setSelectedType("clone");
      return;
    }
    const anyClone = clones.find((c) => c.running ?? c.status === "running");
    if (anyClone) {
      setSelectedId(anyClone.id);
      setSelectedType("clone");
      return;
    }
    const anyCamera = cameras.find((c) => c.running ?? c.status === "running");
    if (anyCamera) {
      setSelectedId(anyCamera.id);
      setSelectedType("camera");
    }
  }, [selectedMode, clones, cameras]);

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

  const addClone = (id) => setCloneActionLoading((p) => new Set(p).add(id));
  const removeClone = (id) =>
    setCloneActionLoading((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });

  async function doCloneStart(id) {
    addClone(id);
    try {
      await handleCloneStart(id);
      const clone = clones.find((c) => c.id === id);
      if (clone?.mode === "fire") await ensureFireSession(clone);
    } catch (e) {
      console.error(e.message);
    } finally {
      removeClone(id);
    }
  }
  async function doCloneStop(id) {
    addClone(id);
    try {
      await handleCloneStop(id);
      const clone = clones.find((c) => c.id === id);
      if (clone?.mode === "fire") await endFireSession(clone);
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
      else {
        if (item.mode === "fire") await endFireSession(item);
        await handleCloneDelete(item.id);
      }
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  const [cloneSource, setCloneSource] = useState(null);

  async function onCloneCreated(clone) {
    setCloneSource(null);
    if (clone?.id) {
      // setSelectedId(clone.id); //big screen enabled
      // setSelectedType("clone");
      try {
        await startClone(clone.id);
      } catch (e) {
        console.error("Auto-start failed:", e.message);
      }
    }
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
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video">
                  <img
                    key={selectedCam.id}
                    src={getCameraStreamUrl(selectedCam.id)}
                    alt="Live stream"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.opacity = "0";
                    }}
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
                  {selectedCam.source_type && (
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
                          {selectedCam.source_type}
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
            <PPEPanel />
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
                <div className="relative w-full bg-[#0f172a] flex items-center justify-center rounded-xl overflow-hidden aspect-video">
                  <CloneThumb
                    clone={selectedClone}
                    jobId={fireJobs[selectedClone.id]}
                    isRunning={
                      selectedClone.running ??
                      selectedClone.status === "running"
                    }
                    alt={selectedClone.name}
                  />
                  {!(
                    selectedClone.running ?? selectedClone.status === "running"
                  ) && (
                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                      <Camera size={32} className="text-white" />
                      <span className="text-white text-sm font-poppins">
                        Stopped
                      </span>
                    </div>
                  )}
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
                  {selectedClone.mode === "crowd" &&
                    selectedClone.latest_payload?.crowd_alert?.confirmed &&
                    selectedClone.latest_payload?.crowd_alert?.active && (
                      <div
                        className="absolute top-0 left-0 right-0 flex items-center justify-center py-1.5 font-poppins text-[12px] font-bold text-white text-center px-2"
                        style={{ background: "rgba(239,68,68,0.92)" }}
                      >
                        🚨 CRITICAL: CROWD ALERT!{" "}
                        {selectedClone.latest_payload.crowd_alert.person_count}{" "}
                        PEOPLE DETECTED (LIMIT:{" "}
                        {selectedClone.latest_payload.crowd_alert.crowd_limit})
                      </div>
                    )}
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
              clone={selectedClone}
              fireJobId={fireJobs[selectedClone.id]}
            />
          </div>
        </div>
      )}

      {/* ── ALERTS ── */}
      <AlertSection
        alertClones={alertClones}
        fireJobs={fireJobs}
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
              hasAnyClones={hasAnyClones}
              fireJobs={fireJobs}
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
              onCloneStart={doCloneStart}
              onCloneStop={doCloneStop}
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
                fireJobs={fireJobs}
                alertMap={alertMap}
                selectedId={selectedId}
                selectedType={selectedType}
                onClickClone={(id) => {
                  setSelectedId(id);
                  setSelectedType("clone");
                }}
                onStart={doCloneStart}
                onStop={doCloneStop}
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
