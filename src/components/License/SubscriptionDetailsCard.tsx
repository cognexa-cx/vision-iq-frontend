// src/components/License/SubscriptionDetailsCard.tsx
import { LicenseInfo } from "../../data/licenseData";
import { DETECTION_TYPES } from "../../data/cameraMasterData";
import { formatEventDate } from "../../utils/eventFormatters";

export interface SubscriptionDetailsCardProps {
  info: LicenseInfo;
}

export default function SubscriptionDetailsCard({ info }: SubscriptionDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 h-full" style={{ border: "1px solid rgba(97,32,214,0.08)" }}>
      <p className="font-poppins text-sm font-semibold mb-4" style={{ color: "#00183E" }}>Subscription</p>

      <div className="flex flex-col gap-3.5">
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">Purchase Order</p>
          <p className="text-sm font-semibold" style={{ color: "#00183E" }}>{info.purchaseOrder}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">Date of Subscription</p>
          <p className="text-sm font-semibold" style={{ color: "#00183E" }}>{formatEventDate(info.subscriptionDate)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-1.5">{DETECTION_TYPES.length} Licensed Solutions</p>
          <div className="flex flex-wrap gap-1.5">
            {DETECTION_TYPES.map((t) => (
              <span
                key={t.key}
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: "#F4EEFF", color: "#3D0C92" }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
