import { useState, useRef, useEffect } from "react";
import Footer from "../components/Common/Footer";
import { useFireRtsp } from "../hooks/useFireRtsp";
import { getFireRtspStreamUrl } from "../api/fire";
import sirenSrc from "../assets/Siren1.mp3";

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

export default function FireDetectionPage({ isCollapsed = false }) {
  const [rtspUrl, setRtspUrl] = useState("");
  const [cameraName, setCameraName] = useState("");
  const [muted, setMuted] = useState(false);
  const { jobId, starting, error, status, start, stop, stopAlert } =
    useFireRtsp();

  const { fire, smoke } = extractFlags(status);
  const isAlert = fire || smoke;
  const audioRef = useSiren(isAlert, muted);

  async function handleStart() {
    if (!rtspUrl.trim()) return;
    try {
      await start(rtspUrl.trim(), cameraName.trim() || undefined);
    } catch (e) {
      alert("Failed to start RTSP session: " + e.message);
    }
  }

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300 left-0 md:left-[80px] ${
        isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"
      }`}
      style={{ background: "#F4F6F8" }}
    >
      <audio ref={audioRef} src={sirenSrc} preload="auto" />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-6 px-4 sm:px-6 pb-6">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0F345E" }}
          >
            Fire Detection — Live RTSP
          </h1>

          {/* ── RTSP source form ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://user:pass@ip:port/path"
                disabled={!!jobId}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
              />
              <input
                type="text"
                value={cameraName}
                onChange={(e) => setCameraName(e.target.value)}
                placeholder="Camera name (optional)"
                disabled={!!jobId}
                className="sm:w-56 px-4 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
              {!jobId ? (
                <button
                  onClick={handleStart}
                  disabled={starting || !rtspUrl.trim()}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                  }}
                >
                  {starting ? "STARTING…" : "START MONITORING"}
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02]"
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)",
                  }}
                >
                  STOP MONITORING
                </button>
              )}
            </div>
            {error && (
              <p className="text-xs font-semibold text-red-500">{error}</p>
            )}
          </div>

          {/* ── Live feed + status ── */}
          {jobId && (
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              style={{ maxWidth: "480px" }}
            >
              <div className="relative w-full bg-[#0f172a] aspect-video flex items-center justify-center">
                <FireStream jobId={jobId} />
                {isAlert && (
                  <div
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-white text-xs font-bold animate-pulse"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                  >
                    🔥 {fire ? "FIRE" : ""} {smoke ? "SMOKE" : ""} DETECTED
                  </div>
                )}
                <div
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
                {isAlert ? (
                  <span className="px-4 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-500 text-sm font-semibold animate-pulse">
                    🔥 ALERT ACTIVE
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-600 text-sm font-semibold">
                    ✅ No Fire / Smoke Detected
                  </span>
                )}

                <button
                  onClick={() => setMuted((m) => !m)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105"
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
                    onClick={stopAlert}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    Stop Alert
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
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
