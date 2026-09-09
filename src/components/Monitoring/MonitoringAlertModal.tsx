// src/components/Monitoring/MonitoringAlertModal.tsx
// Clicking an alert opens the live camera feed (not the dense Events-style
// field grid) — the point of an alert is "what's happening right now on
// that camera", so the stream is the focus and only the handful of details
// someone actually needs alongside it are shown.
import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { getCameraStreamUrl } from "../../api/cameras";
import { EventRecord } from "../../data/eventsData";
import { formatAlertName, formatEventDate, formatEventTime } from "../../utils/eventFormatters";
import { BRAND_GRADIENT } from "../../theme";

interface DetailChipProps {
  label: string;
  value: string;
  subValue?: string;
}

function DetailChip({ label, value, subValue }: DetailChipProps) {
  return (
    <div className="flex-1 min-w-0 bg-white rounded-lg px-3 py-2" style={{ border: "1px solid rgba(97,32,214,0.08)" }}>
      <p className="text-[10px] font-medium leading-tight" style={{ color: "#8B7FB3" }}>{label}</p>
      <p className="text-[13px] font-semibold mt-0.5 leading-tight truncate" style={{ color: "#00183E" }}>{value}</p>
      {subValue && (
        <p className="text-[11px] font-medium leading-tight truncate" style={{ color: "#8B7FB3" }}>{subValue}</p>
      )}
    </div>
  );
}

export interface MonitoringAlertModalProps {
  event?: EventRecord;
  photoSrc?: string;
  onClose: () => void;
}

export default function MonitoringAlertModal({ event, photoSrc, onClose }: MonitoringAlertModalProps) {
  const [streamError, setStreamError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setStreamError(false);
    setRefreshKey(0);
  }, [event?.id]);

  if (!event) return null;
  const ts = event.created_at || event.timestamp;
  const cameraLabel = event.camera_name || event.camera_id || "—";
  const streamUrl = event.camera_id ? `${getCameraStreamUrl(String(event.camera_id))}?t=${refreshKey}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-poppins"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-[0_25px_60px_-12px_rgba(61,12,146,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ background: BRAND_GRADIENT }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Live Alert</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X size={16} color="#FFFFFF" />
            </button>
          </div>
          <p className="text-xs text-white/70 mt-1">
            Camera {cameraLabel} · Zone {event.zone_no ?? event.zone ?? "01"}
          </p>
        </div>

        {/* Live stream — the primary focus of this modal */}
        <div className="px-6 pt-4">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0f172a]">
            {streamUrl && !streamError ? (
              <img
                key={refreshKey}
                src={streamUrl}
                alt="Live camera stream"
                className="w-full h-full object-cover"
                onError={() => setStreamError(true)}
              />
            ) : photoSrc ? (
              <img src={photoSrc} alt="Latest snapshot" className="w-full h-full object-cover opacity-80" />
            ) : null}

            {streamUrl && !streamError && (
              <div
                className="absolute top-3 right-3 px-2.5 py-1 rounded text-white text-xs font-bold flex items-center gap-1"
                style={{ background: "rgba(194,24,7,0.85)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
                LIVE
              </div>
            )}

            {(!streamUrl || streamError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                <p className="text-xs text-white/60">Live stream unavailable — showing last snapshot</p>
                <button
                  onClick={() => { setStreamError(false); setRefreshKey((k) => k + 1); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* A handful of key details — not the full Events field grid */}
        <div className="flex flex-wrap gap-2 px-6 py-5">
          <DetailChip label="Camera ID" value={String(cameraLabel)} />
          <DetailChip label="Zone" value={String(event.zone_no ?? event.zone ?? "01")} />
          <DetailChip label="Alert" value={formatAlertName(event.type || event.event_type)} />
          <DetailChip label="Time" value={ts ? formatEventTime(ts) : "—"} subValue={ts ? formatEventDate(ts) : undefined} />
        </div>
      </div>
    </div>
  );
}
