// src/components/Events/EventsTable.tsx
import { Eye } from "lucide-react";
import { getEventSnapshotUrl } from "../../api/events";
import { EventRecord } from "../../data/eventsData";
import { ICON_BUTTON_BG, ICON_BUTTON_COLOR } from "../../theme";
import placeholderThumb from "../../assets/figma-event-thumb.png";
import placeholderThumbLarge from "../../assets/figma-event-thumb-large.png";
import { formatAlertName, formatEventDate, formatEventTime } from "../../utils/eventFormatters";

const COLUMN_WIDTHS = [90, 130, 100, 140, 150, 120, 100, 80];
const TABLE_HEADERS = ["Sr.No.", "Photo", "Zone No.", "Camera ID", "Alert Name", "Date", "Time", "View"];
const headerCellCls = "px-2 text-sm font-semibold";
const rowCellCls = "px-2 text-sm";

export interface EventDetailsPayload {
  event: EventRecord;
  srNo: string;
  photoSrc: string;
}

export interface EventsTableProps {
  events: EventRecord[];
  srNoByEventId: Map<string | number, number>;
  onOpenDetails: (payload: EventDetailsPayload) => void;
  onOpenPhoto: (photoSrc: string) => void;
}

export default function EventsTable({ events, srNoByEventId, onOpenDetails, onOpenPhoto }: EventsTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto themed-scrollbar">
      <table className="text-left" style={{ tableLayout: "fixed", borderCollapse: "separate", minWidth: 900, width: "100%" }}>
        <colgroup>
          {COLUMN_WIDTHS.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead style={{ position: "sticky", top: 0, background: "#F8F8FE", zIndex: 1 }}>
          <tr style={{ height: 60 }}>
            {TABLE_HEADERS.map((h, i) => (
              <th key={h} className={`${headerCellCls} ${i === 0 ? "pl-6" : ""}`} style={{ color: "#003473" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length} className="px-8 py-16 text-center text-gray-400 text-sm">
                No events found for the current filters.
              </td>
            </tr>
          ) : (
            events.map((event, idx) => {
              const srNo = String(srNoByEventId.get(event.id) ?? idx + 1).padStart(2, "0");
              const ts = event.created_at || event.timestamp;
              const snapshotUrl = event.snapshot_path ? getEventSnapshotUrl(event.id) : null;
              const openDetails = () => onOpenDetails({ event, srNo, photoSrc: snapshotUrl || placeholderThumbLarge });

              return (
                <tr
                  key={event.id ?? idx}
                  onClick={openDetails}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetails();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for event ${srNo}`}
                  className="border-t cursor-pointer hover:bg-[#F8F5FF] focus-visible:bg-[#F8F5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D0C92]/40 transition-colors"
                  style={{ height: 60, borderColor: "#F0F0F0" }}
                >
                  <td className={`${rowCellCls} pl-6`} style={{ color: "#00183E" }}>{srNo}.</td>
                  <td className={rowCellCls}>
                    <img
                      src={snapshotUrl || placeholderThumb}
                      alt="Event snapshot"
                      onClick={(e) => { e.stopPropagation(); onOpenPhoto(snapshotUrl || placeholderThumbLarge); }}
                      onError={(e) => { e.currentTarget.src = placeholderThumb; }}
                      className="w-[90px] h-[50px] object-cover rounded-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>{event.zone_no ?? event.zone ?? "01"}</td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>{event.camera_id ?? event.camera_name ?? "—"}</td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>{formatAlertName(event.type || event.event_type)}</td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>{ts ? formatEventDate(ts) : "—"}</td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>{ts ? formatEventTime(ts) : "—"}</td>
                  <td className={rowCellCls}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDetails(); }}
                      aria-label="View event"
                      tabIndex={-1}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ background: ICON_BUTTON_BG }}
                    >
                      <Eye size={16} color={ICON_BUTTON_COLOR} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
