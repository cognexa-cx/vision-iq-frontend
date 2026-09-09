// src/pages/MonitoringPage.tsx
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { getCameras } from "../api/cameras";
import { getEvents } from "../api/events";
import { DUMMY_EVENTS, EventRecord } from "../data/eventsData";
import { DUMMY_ZONES, DUMMY_TOTAL_CAMERAS, ZoneRecord } from "../data/monitoringData";
import { ACCENT_LINE_GRADIENT, HEADING_TEXT_GRADIENT, BRAND_GRADIENT } from "../theme";
import MonitoringViewToggle, { MonitoringView } from "../components/Monitoring/MonitoringViewToggle";
import MonitoringMapView from "../components/Monitoring/MonitoringMapView";
import MonitoringGridView from "../components/Monitoring/MonitoringGridView";
import MonitoringAlerts, { AlertDetailsPayload } from "../components/Monitoring/MonitoringAlerts";
import MonitoringAlertModal from "../components/Monitoring/MonitoringAlertModal";

const VIEW_STORAGE_KEY = "monitoringView";

function readStoredView(): MonitoringView {
  return localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "map";
}

export default function MonitoringPage() {
  const [view, setViewState] = useState<MonitoringView>(readStoredView);
  const [activeZone, setActiveZone] = useState<ZoneRecord | undefined>();
  const [totalCameras, setTotalCameras] = useState(DUMMY_TOTAL_CAMERAS);
  const [zones, setZones] = useState<ZoneRecord[]>(DUMMY_ZONES);
  const [events, setEvents] = useState<EventRecord[]>(DUMMY_EVENTS);
  const [selectedAlert, setSelectedAlert] = useState<AlertDetailsPayload | null>(null);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const cameras = await getCameras();
      setTotalCameras(cameras.length);
      if (cameras.length > 0) {
        setZones(
          cameras.map((c, i) => ({
            id: String(c.id),
            label: `Zone ${String(i + 1).padStart(2, "0")}`,
            cameras: [{ id: c.id, name: c.name, enabled: c.enabled ?? c.status?.connected }],
          })),
        );
      }
    } catch {
      // Backend unreachable — keep showing sample zones/camera count.
      setTotalCameras(DUMMY_TOTAL_CAMERAS);
      setZones(DUMMY_ZONES);
    }

    try {
      const data = await getEvents({ limit: 20 });
      setEvents(data as EventRecord[]);
    } catch {
      setEvents(DUMMY_EVENTS);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    const id = setInterval(fetchMonitoringData, 30_000);
    return () => clearInterval(id);
  }, [fetchMonitoringData]);

  const setView = (next: MonitoringView) => {
    setViewState(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  const handleSelectZone = (zone: ZoneRecord) => {
    setActiveZone(zone);
    setView("map");
  };

  return (
    <div className="w-full h-full flex flex-col font-poppins">
      {/* Header row: title (+ back arrow in Grid View) + view toggle */}
      <div className="relative flex items-center justify-between flex-shrink-0" style={{ height: 82 }}>
        <div className="flex items-center gap-3">
          {view === "grid" && (
            <button
              onClick={() => setView("map")}
              aria-label="Back to Map view"
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: BRAND_GRADIENT }}
            >
              <ArrowLeft size={14} color="#fff" />
            </button>
          )}
          <span className="w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }} />
          <h1
            className="text-2xl font-semibold bg-clip-text text-transparent"
            style={{ backgroundImage: HEADING_TEXT_GRADIENT }}
          >
            Monitoring
          </h1>
        </div>

        <MonitoringViewToggle view={view} onChange={setView} />
      </div>

      {/* Content: main panel (map or grid) + Alerts rail, shared outer card */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          className="flex-1 min-h-0 rounded-[20px] shadow-[0_20px_45px_-10px_rgba(61,12,146,0.18)] flex gap-4 p-4 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          {view === "map" ? (
            <MonitoringMapView totalCameras={totalCameras} activeZone={activeZone} />
          ) : (
            <MonitoringGridView zones={zones} onSelectZone={handleSelectZone} />
          )}
          <MonitoringAlerts events={events} onOpenDetails={setSelectedAlert} />
        </div>

        {view === "map" && (
          <p className="font-poppins text-sm text-gray-500 pt-3 flex-shrink-0">Hundai Plant Zones</p>
        )}
      </div>

      <MonitoringAlertModal
        event={selectedAlert?.event}
        photoSrc={selectedAlert?.photoSrc}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}
