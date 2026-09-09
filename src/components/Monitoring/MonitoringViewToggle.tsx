// src/components/Monitoring/MonitoringViewToggle.tsx
export type MonitoringView = "map" | "grid";

export interface MonitoringViewToggleProps {
  view: MonitoringView;
  onChange: (view: MonitoringView) => void;
}

const KNOB_COLOR = "#4438DB";

export default function MonitoringViewToggle({ view, onChange }: MonitoringViewToggleProps) {
  const isGrid = view === "grid";

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange("map")}
        className="font-poppins text-sm font-medium"
        style={{ color: isGrid ? "#9CA3AF" : "#00183E" }}
      >
        Map view
      </button>

      <button
        role="switch"
        aria-checked={isGrid}
        aria-label="Toggle between Map view and Grid View"
        onClick={() => onChange(isGrid ? "map" : "grid")}
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
        style={{ background: "#EFEFF4" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full transition-[left] duration-200 ease-out"
          style={{ left: isGrid ? 22 : 2, background: KNOB_COLOR }}
        />
      </button>

      <button
        onClick={() => onChange("grid")}
        className="font-poppins text-sm font-medium"
        style={{ color: isGrid ? "#00183E" : "#9CA3AF" }}
      >
        Grid View
      </button>
    </div>
  );
}
