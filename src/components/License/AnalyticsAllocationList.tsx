// src/components/License/AnalyticsAllocationList.tsx
// Shows how many cameras are assigned to each licensed analytic — reuses the
// exact same DETECTION_TYPES config and per-camera tags Camera Master
// manages, so this page never disagrees with what's actually assigned there.
import { DETECTION_TYPES } from "../../data/cameraMasterData";

export interface AnalyticsAllocationListProps {
  usageByType: Record<string, number>;
  camerasUsed: number;
  camerasAllowed: number;
}

export default function AnalyticsAllocationList({ usageByType, camerasUsed, camerasAllowed }: AnalyticsAllocationListProps) {
  return (
    <div className="bg-white rounded-2xl p-5 h-full" style={{ border: "1px solid rgba(97,32,214,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-poppins text-sm font-semibold" style={{ color: "#00183E" }}>Camera Allocation</p>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F4EEFF", color: "#3D0C92" }}>
          {camerasUsed} / {camerasAllowed} total
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {DETECTION_TYPES.map((t) => {
          const used = usageByType[t.key] ?? 0;
          const pct = Math.min(100, (used / t.max) * 100);
          return (
            <div key={t.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium" style={{ color: "#00183E" }}>{t.label}</span>
                <span className="font-semibold" style={{ color: "#3D0C92" }}>{used} / {t.max}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#F0EAFE" }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "#3D0C92" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
