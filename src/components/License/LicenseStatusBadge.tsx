// src/components/License/LicenseStatusBadge.tsx
import { LicenseStatus, LICENSE_STATUS_COLORS } from "../../data/licenseData";

export interface LicenseStatusBadgeProps {
  status: LicenseStatus;
}

export default function LicenseStatusBadge({ status }: LicenseStatusBadgeProps) {
  const c = LICENSE_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {status}
    </span>
  );
}
