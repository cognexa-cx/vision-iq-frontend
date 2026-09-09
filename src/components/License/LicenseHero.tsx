// src/components/License/LicenseHero.tsx
// The page's focal point: who this license belongs to, its key, and where
// "now" sits on the subscription's timeline — everything else on the page
// is supporting detail.
import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { LicenseInfo, LicenseStatus } from "../../data/licenseData";
import { maskLicenseKey, computeElapsedPercent } from "../../utils/licenseHelpers";
import { formatEventDate } from "../../utils/eventFormatters";
import { HERO_GRADIENT } from "../../theme";
import LicenseStatusBadge from "./LicenseStatusBadge";

export interface LicenseHeroProps {
  info: LicenseInfo;
  status: LicenseStatus;
  daysRemaining: number;
}

export default function LicenseHero({ info, status, daysRemaining }: LicenseHeroProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(info.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing more we can do here.
    }
  };

  const elapsedPct = computeElapsedPercent(info.startDate, info.validTill);

  return (
    <div className="relative flex-shrink-0 rounded-[24px] p-6 sm:p-8 overflow-hidden text-white" style={{ background: HERO_GRADIENT }}>
      {/* Decorative — echoes the eye-icon brand mark without competing with content. */}
      <div
        className="absolute -right-10 -top-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)" }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60 mb-1">{info.planName}</p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">{info.companyName}</h2>
        </div>
        <LicenseStatusBadge status={status} />
      </div>

      <div className="relative flex flex-wrap items-end gap-x-10 gap-y-5 mt-7">
        <div>
          <p className="text-xs font-medium text-white/60 mb-1">Days Remaining</p>
          <p className="text-4xl font-bold leading-none">{daysRemaining < 0 ? "Expired" : daysRemaining}</p>
        </div>

        <div className="w-full sm:w-auto sm:flex-1 min-w-0 sm:min-w-[240px]">
          <p className="text-xs font-medium text-white/60 mb-2">License Key</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm font-mono tracking-wide truncate bg-white/10">
              {revealed ? info.licenseKey : maskLicenseKey(info.licenseKey)}
            </div>
            <button
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide license key" : "Reveal license key"}
              className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              onClick={handleCopy}
              aria-label="Copy license key"
              className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copied ? <Check size={15} color="#86EFAC" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Subscription timeline — where "now" sits between Start Date and Valid Till. */}
      <div className="relative mt-7">
        <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full rounded-full bg-white" style={{ width: `${elapsedPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-white/70">
          <span>Start {formatEventDate(info.startDate)}</span>
          <span>Valid till {formatEventDate(info.validTill)}</span>
        </div>
      </div>
    </div>
  );
}
