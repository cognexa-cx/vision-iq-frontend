// src/components/Monitoring/MonitoringAlerts.tsx
// Right-hand "Alerts" rail — reuses the real Events API (same data source and
// snapshot URLs as the Events page) so this isn't a static mock; it shows
// whatever the backend's most recent detections actually are, falling back
// to the same sample events the Events page uses when it's unreachable.
import { getEventSnapshotUrl } from "../../api/events";
import { EventRecord } from "../../data/eventsData";
import { formatAlertName } from "../../utils/eventFormatters";
import placeholderThumbLarge from "../../assets/figma-event-thumb-large.png";

export interface AlertDetailsPayload {
  event: EventRecord;
  srNo: string;
  photoSrc: string;
}

export interface MonitoringAlertsProps {
  events: EventRecord[];
  onOpenDetails: (payload: AlertDetailsPayload) => void;
}

const ALERTS_LIMIT = 8;

export default function MonitoringAlerts({ events, onOpenDetails }: MonitoringAlertsProps) {
  const alerts = events.slice(0, ALERTS_LIMIT);

  return (
    <div className="w-full md:w-[300px] md:flex-shrink-0 max-h-[60vh] md:max-h-none rounded-[16px] bg-white flex flex-col overflow-hidden">
      <h2 className="font-poppins text-base font-bold px-4 pt-4 pb-3 flex-shrink-0" style={{ color: "#E31C1C" }}>
        Alerts
      </h2>

      <div className="flex-1 min-h-0 overflow-y-auto themed-scrollbar px-4 pb-4 flex flex-col gap-3">
        {alerts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No recent alerts.</p>
        )}

        {alerts.map((event, idx) => {
          const snapshotUrl = event.snapshot_path ? getEventSnapshotUrl(event.id) : placeholderThumbLarge;
          const cameraLabel = event.camera_name || `Camera ${String(event.camera_id ?? idx + 1)}`;

          const srNo = String(idx + 1).padStart(2, "0");

          return (
            <button
              key={event.id ?? idx}
              onClick={() => onOpenDetails({ event, srNo, photoSrc: snapshotUrl })}
              aria-label={`View details for alert ${srNo}`}
              className="relative w-full h-[130px] rounded-[14px] overflow-hidden flex-shrink-0 text-left hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D0C92]/40"
            >
              <img
                src={snapshotUrl}
                alt=""
                onError={(e) => { e.currentTarget.src = placeholderThumbLarge; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.65) 100%)" }}
              />
              <div className="absolute top-2 left-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#EF4444" }} />
                <span className="font-poppins text-[11px] font-bold uppercase text-white tracking-wide">
                  {cameraLabel}
                </span>
              </div>
              <p className="absolute bottom-2 left-2.5 right-2.5 font-poppins text-[12px] font-bold" style={{ color: "#FF5A5A" }}>
                {formatAlertName(event.type || event.event_type)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
