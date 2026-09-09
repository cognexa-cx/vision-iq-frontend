// src/components/Monitoring/MonitoringGridView.tsx
import { useState } from "react";
import { Camera as CameraIcon, ChevronDown } from "lucide-react";
import { getCameraSnapshotUrl } from "../../api/cameras";
import { ACCENT_LINE_GRADIENT } from "../../theme";
import { ZoneRecord, ZoneCamera } from "../../data/monitoringData";

export interface MonitoringGridViewProps {
  zones: ZoneRecord[];
  onSelectZone: (zone: ZoneRecord) => void;
}

function CameraThumb({ camera, onClick }: { camera: ZoneCamera; onClick: () => void }) {
  const isDummy = String(camera.id).startsWith("dummy-");
  const snapshotUrl = !isDummy ? getCameraSnapshotUrl(String(camera.id)) : null;
  const isOnline = camera.enabled !== false;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-[12px] overflow-hidden bg-white hover:opacity-90 transition-opacity text-left"
      style={{ border: "1px solid #EFEFF4" }}
    >
      <div className="relative w-full aspect-video bg-[#EFEFF4] flex items-center justify-center">
        {snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <CameraIcon size={20} className="text-gray-400" />
        )}
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full border border-white"
          style={{ background: isOnline ? "#22C55E" : "#9CA3AF" }}
        />
      </div>
      <div className="px-2.5 py-2">
        <p className="font-poppins text-xs font-medium truncate" style={{ color: "#00183E" }}>
          {camera.name ?? `Camera ${camera.id}`}
        </p>
        <p className="font-poppins text-[11px]" style={{ color: isOnline ? "#22C55E" : "#9CA3AF" }}>
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </button>
  );
}

export default function MonitoringGridView({ zones, onSelectZone }: MonitoringGridViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto themed-scrollbar flex flex-col gap-3 pr-1">
      {zones.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No zones configured yet.</p>
      )}

      {zones.map((zone) => {
        const isExpanded = expandedId === zone.id;
        const onlineCount = zone.cameras.filter((c) => c.enabled !== false).length;

        return (
          <div key={zone.id} className="rounded-[14px] overflow-hidden" style={{ background: "#FBFBFB" }}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : zone.id)}
              aria-expanded={isExpanded}
              className="relative w-full h-[64px] flex-shrink-0 flex items-center gap-4 pl-6 pr-4 text-left hover:bg-[#F8F5FF] transition-colors"
            >
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] rounded-full"
                style={{ background: ACCENT_LINE_GRADIENT }}
              />
              <span className="flex-1 font-poppins text-[15px] font-medium" style={{ color: "#00183E" }}>
                {zone.label}
              </span>
              <span className="font-poppins text-xs text-gray-400">
                {onlineCount}/{zone.cameras.length} online
              </span>
              <ChevronDown
                size={16}
                className="text-gray-400 transition-transform duration-200 flex-shrink-0"
                style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {isExpanded && (
              <div className="grid gap-3 px-4 pb-4 pt-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {zone.cameras.map((camera) => (
                  <CameraThumb key={camera.id} camera={camera} onClick={() => onSelectZone(zone)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
