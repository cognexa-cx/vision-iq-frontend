// src/components/Monitoring/MonitoringMapView.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Minus, Hand } from "lucide-react";
import siteMap from "../../assets/monitoring-map.jpg";
import { ZoneRecord } from "../../data/monitoringData";
import { ICON_BUTTON_BG, ICON_BUTTON_COLOR } from "../../theme";

export interface MonitoringMapViewProps {
  totalCameras: number;
  activeZone?: ZoneRecord;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export default function MonitoringMapView({ totalCameras, activeZone }: MonitoringMapViewProps) {
  const [zoom, setZoom] = useState(1);
  const [handActive, setHandActive] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Keeps the image from being dragged past its own edges — the max offset
  // in each direction is exactly how much bigger the scaled image is than
  // its container.
  const clampPan = useCallback(
    (next: { x: number; y: number }, z: number) => {
      const el = containerRef.current;
      if (!el) return next;
      const maxX = (el.clientWidth * (z - 1)) / 2;
      const maxY = (el.clientHeight * (z - 1)) / 2;
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [],
  );

  // Snap back to centered once zoomed out to 1:1 — nothing to pan anymore.
  useEffect(() => {
    if (zoom === MIN_ZOOM) setPan({ x: 0, y: 0 });
    else setPan((p) => clampPan(p, zoom));
  }, [zoom, clampPan]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!handActive || zoom === MIN_ZOOM) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan(clampPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy }, zoom));
  };

  const stopDragging = () => setDragging(false);

  const canPan = handActive && zoom > MIN_ZOOM;

  return (
    <div className="relative flex-1 min-w-0 flex flex-col gap-2">
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 rounded-[20px] overflow-hidden bg-black"
        style={{ cursor: canPan ? (dragging ? "grabbing" : "grab") : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={siteMap}
            alt="Site map"
            draggable={false}
            className={`w-full h-full object-cover ${dragging ? "" : "transition-transform duration-200 ease-out"}`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
        </div>

        <span className="absolute top-4 left-5 font-poppins text-sm font-semibold text-white drop-shadow pointer-events-none">
          Map View
        </span>

        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-poppins text-xs font-medium text-white/90 drop-shadow bg-black/25 px-3 py-1 rounded-full pointer-events-none">
          Total Cameras: {totalCameras}
        </span>

        {activeZone && (
          <span className="absolute left-8 bottom-6 font-poppins text-2xl font-semibold text-white drop-shadow pointer-events-none">
            {activeZone.label}
          </span>
        )}
      </div>

      {/* Map tools — kept outside the map surface so they're not overlapping
          the imagery. Hand tool enables drag-to-pan once zoomed in. */}
      <div className="flex-shrink-0 flex items-center justify-end gap-2">
        <button
          onClick={() => setHandActive((h) => !h)}
          disabled={zoom === MIN_ZOOM}
          aria-label="Pan tool"
          aria-pressed={handActive}
          title={zoom === MIN_ZOOM ? "Zoom in to pan the map" : "Drag to pan the map"}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors"
          style={
            handActive
              ? { background: ICON_BUTTON_BG, color: ICON_BUTTON_COLOR, border: "1px solid transparent" }
              : { background: "#fff", border: "1px solid #E5E7EB", color: "#3D0C92" }
          }
        >
          <Hand size={16} />
        </button>
        <span
          className="font-poppins text-xs font-medium tabular-nums select-none"
          style={{ color: "#6B7280", minWidth: 40, textAlign: "center" }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F4EEFF] disabled:opacity-40 transition-colors"
          style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#3D0C92" }}
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F4EEFF] disabled:opacity-40 transition-colors"
          style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#3D0C92" }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
