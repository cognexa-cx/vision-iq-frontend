// src/components/License/SupportSection.tsx
import { Mail, Phone, BookOpen } from "lucide-react";
import { LicenseInfo } from "../../data/licenseData";
import { BRAND_GRADIENT } from "../../theme";

export interface SupportSectionProps {
  info: LicenseInfo;
}

export default function SupportSection({ info }: SupportSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-5 h-full flex flex-col" style={{ border: "1px solid rgba(97,32,214,0.08)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-poppins text-sm font-semibold" style={{ color: "#00183E" }}>Support</p>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#F4EEFF", color: "#3D0C92" }}>
          {info.supportTier}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 text-sm mb-4 flex-1">
        <a href={`mailto:${info.supportEmail}`} className="flex items-center gap-2 hover:underline" style={{ color: "#00183E" }}>
          <Mail size={15} style={{ color: "#3D0C92" }} className="flex-shrink-0" />
          {info.supportEmail}
        </a>
        <a href={`tel:${info.supportPhone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:underline" style={{ color: "#00183E" }}>
          <Phone size={15} style={{ color: "#3D0C92" }} className="flex-shrink-0" />
          {info.supportPhone}
        </a>
        <a href={info.knowledgeBaseUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline" style={{ color: "#00183E" }}>
          <BookOpen size={15} style={{ color: "#3D0C92" }} className="flex-shrink-0" />
          Visit Knowledge Base
        </a>
      </div>

      <a
        href={`mailto:${info.supportEmail}?subject=${encodeURIComponent("Support request")}`}
        className="block text-center w-full py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: BRAND_GRADIENT }}
      >
        Raise a Ticket
      </a>
    </div>
  );
}
