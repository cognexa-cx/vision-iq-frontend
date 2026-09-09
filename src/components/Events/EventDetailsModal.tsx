// src/components/Events/EventDetailsModal.tsx
import { X } from "lucide-react";
import { SEVERITY_COLORS, EventRecord } from "../../data/eventsData";
import { formatAlertName, formatEventDate, formatEventTime } from "../../utils/eventFormatters";
import { BRAND_GRADIENT } from "../../theme";

interface DetailFieldProps {
  label: string;
  value: string;
  wide?: boolean;
}

function DetailField({ label, value, wide }: DetailFieldProps) {
  return (
    <div className={`bg-white rounded-lg px-3 py-2 ${wide ? "col-span-2 sm:col-span-3" : ""}`} style={{ border: "1px solid rgba(97,32,214,0.08)" }}>
      <p className="text-[10px] font-medium leading-tight" style={{ color: "#8B7FB3" }}>{label}</p>
      <p className="text-[13px] font-semibold mt-0.5 leading-tight break-words" style={{ color: "#00183E" }}>{value}</p>
    </div>
  );
}

export interface EventDetailsModalProps {
  event?: EventRecord;
  photoSrc?: string;
  srNo?: string;
  onClose: () => void;
}

export default function EventDetailsModal({ event, photoSrc, srNo, onClose }: EventDetailsModalProps) {
  if (!event) return null;
  const ts = event.created_at || event.timestamp;
  const sevColor = SEVERITY_COLORS[event.severity as string] || SEVERITY_COLORS.medium;

  const fields: DetailFieldProps[] = [
    { label: "Sr.No.", value: `${srNo}.` },
    { label: "Zone No.", value: event.zone_no ?? event.zone ?? "01" },
    { label: "Camera ID", value: event.camera_id ?? event.camera_name ?? "—" },
    { label: "Status", value: event.status ?? "—" },
    { label: "Date", value: ts ? formatEventDate(ts) : "—" },
    { label: "Time", value: ts ? formatEventTime(ts) : "—" },
    { label: "Location", value: event.location ?? "—" },
    { label: "Operator", value: event.operator ?? "—" },
    { label: "Confidence", value: event.confidence != null ? `${event.confidence}%` : "—" },
    { label: "Duration", value: event.duration_sec != null ? `${event.duration_sec}s` : "—" },
    { label: "Response Time", value: event.response_time_sec != null ? `${event.response_time_sec}s` : "—" },
    { label: "Detection Model", value: event.detection_model ?? "—" },
    { label: "Camera Type", value: event.camera_type ?? "—" },
    { label: "Resolution", value: event.resolution ?? "—" },
    { label: "Recording ID", value: event.recording_id ?? "—" },
    { label: "Weather", value: event.weather ?? "—" },
    { label: "Device IP", value: event.device_ip ?? "—" },
    { label: "Power Status", value: event.power_status ?? "—" },
    { label: "GPS", value: event.gps ?? "—", wide: true },
    ...(event.notes ? [{ label: "Notes", value: event.notes, wide: true }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-poppins"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-[24px] shadow-[0_25px_60px_-12px_rgba(61,12,146,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient hero header — matches footer/active-nav gradient */}
        <div className="px-6 pt-5 pb-9 flex-shrink-0" style={{ background: BRAND_GRADIENT }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Event Details</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X size={16} color="#FFFFFF" />
            </button>
          </div>
          <p className="text-xs text-white/70 mt-1">
            Camera {event.camera_id ?? event.camera_name ?? "—"} · Zone {event.zone_no ?? event.zone ?? "01"}
          </p>
        </div>

        {/* Photo card — floats up over the gradient banner */}
        <div className="px-6 -mt-6">
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl shadow-[0_12px_30px_-8px_rgba(61,12,146,0.3)] p-3">
            <img src={photoSrc} alt="Event snapshot" className="w-[72px] h-[44px] object-cover rounded-[10px] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 leading-tight">Alert Name</p>
              <p className="text-sm font-semibold leading-tight truncate" style={{ color: "#00183E" }}>
                {formatAlertName(event.type || event.event_type)}
              </p>
            </div>
            {event.severity && (
              <span
                className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: sevColor.bg, color: sevColor.text }}
              >
                {event.severity[0].toUpperCase() + event.severity.slice(1)} severity
              </span>
            )}
          </div>
        </div>

        {/* Dense field grid — no scroll, everything visible at once */}
        <div
          className="grid grid-cols-3 sm:grid-cols-6 gap-2 mx-6 mt-4 mb-6 p-4 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #F8F5FF 0%, #F1F0FF 100%)" }}
        >
          {fields.map((f) => (
            <DetailField key={f.label} label={f.label} value={f.value} wide={f.wide} />
          ))}
        </div>
      </div>
    </div>
  );
}
