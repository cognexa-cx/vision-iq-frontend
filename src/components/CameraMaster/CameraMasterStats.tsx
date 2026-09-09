// src/components/CameraMaster/CameraMasterStats.tsx
import { ACCENT_LINE_GRADIENT } from "../../theme";

export interface CameraMasterStatsProps {
  total: number;
  active: number;
  remaining: number;
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="relative flex-1 min-w-[220px] bg-white rounded-[14px] pl-5 pr-4 py-4 flex items-center justify-between">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT }} />
      <span className="font-poppins text-sm font-medium" style={{ color: "#01397C" }}>{label}</span>
      <span className="font-poppins text-2xl font-bold" style={{ color: "#3D0C92" }}>
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function CameraMasterStats({ total, active, remaining }: CameraMasterStatsProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <StatCard label="Total Cameras" value={total} />
      <StatCard label="Active Cameras" value={active} />
      <StatCard label="Remaining Cameras" value={remaining} />
    </div>
  );
}
