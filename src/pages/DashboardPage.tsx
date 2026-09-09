import { ACCENT_LINE_GRADIENT, HEADING_TEXT_GRADIENT, PANEL_SHADOW } from "../theme";

export default function DashboardPage() {
  return (
    <div className="w-full h-full flex flex-col font-poppins">
      {/* Header row: title — fixed 82px band per spec, panel follows directly */}
      <div className="flex items-center flex-shrink-0" style={{ height: 82 }}>
        <div className="flex items-center gap-3">
          <span className="w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }} />
          <h1
            className="text-2xl font-semibold bg-clip-text text-transparent"
            style={{ backgroundImage: HEADING_TEXT_GRADIENT }}
          >
            Dashboard
          </h1>
        </div>
      </div>

      {/* Content panel — intentionally empty per design */}
      <div
        className="flex-1 rounded-[20px]"
        style={{ background: "rgba(255,255,255,0.6)", boxShadow: PANEL_SHADOW }}
      />
    </div>
  );
}
