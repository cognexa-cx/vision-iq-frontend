// src/pages/LicensePage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { getCameras } from "../api/cameras";
import type { Camera } from "../types/camera";
import { DUMMY_CAMERAS, CAMERA_SEAT_LIMIT, DETECTION_TYPES } from "../data/cameraMasterData";
import { LICENSE_INFO } from "../data/licenseData";
import { computeDaysRemaining, computeLicenseStatus } from "../utils/licenseHelpers";
import { ACCENT_LINE_GRADIENT, HEADING_TEXT_GRADIENT, BRAND_GRADIENT } from "../theme";
import LicenseHero from "../components/License/LicenseHero";
import SubscriptionDetailsCard from "../components/License/SubscriptionDetailsCard";
import AnalyticsAllocationList from "../components/License/AnalyticsAllocationList";
import SupportSection from "../components/License/SupportSection";
import RenewLicenseModal from "../components/License/RenewLicenseModal";

const KNOWN_DETECTION_KEYS = new Set(DETECTION_TYPES.map((t) => t.key));

export default function LicensePage() {
  const [cameras, setCameras] = useState<Camera[]>(DUMMY_CAMERAS);
  const [licenseKey, setLicenseKey] = useState(LICENSE_INFO.licenseKey);
  const [renewOpen, setRenewOpen] = useState(false);

  const fetchCameras = useCallback(async () => {
    try {
      const data = await getCameras();
      setCameras(data.length > 0 ? data : DUMMY_CAMERAS);
    } catch {
      setCameras(DUMMY_CAMERAS);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
    const id = setInterval(fetchCameras, 30_000);
    return () => clearInterval(id);
  }, [fetchCameras]);

  const usageByType = useMemo(() => {
    const usage: Record<string, number> = {};
    for (const c of cameras) {
      for (const tag of c.tags ?? []) {
        if (KNOWN_DETECTION_KEYS.has(tag)) usage[tag] = (usage[tag] ?? 0) + 1;
      }
    }
    return usage;
  }, [cameras]);

  const daysRemaining = computeDaysRemaining(LICENSE_INFO.validTill);
  const status = computeLicenseStatus(daysRemaining);
  const info = { ...LICENSE_INFO, licenseKey };

  return (
    <div className="w-full h-full flex flex-col font-poppins">
      <div className="relative flex flex-wrap items-center justify-between gap-y-2 gap-3 flex-shrink-0" style={{ minHeight: 82 }}>
        <div className="flex items-center gap-3">
          <span className="w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }} />
          <h1 className="text-2xl font-semibold bg-clip-text text-transparent" style={{ backgroundImage: HEADING_TEXT_GRADIENT }}>
            License
          </h1>
        </div>

        <button
          onClick={() => setRenewOpen(true)}
          className="h-10 px-5 rounded-[10px] text-white text-sm font-semibold flex items-center"
          style={{ background: BRAND_GRADIENT }}
        >
          Renew License
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto themed-scrollbar flex flex-col gap-4 pb-2">
        <LicenseHero info={info} status={status} daysRemaining={daysRemaining} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch flex-shrink-0">
          <SubscriptionDetailsCard info={info} />
          <AnalyticsAllocationList usageByType={usageByType} camerasUsed={cameras.length} camerasAllowed={CAMERA_SEAT_LIMIT} />
          <SupportSection info={info} />
        </div>
      </div>

      <RenewLicenseModal open={renewOpen} onClose={() => setRenewOpen(false)} onSubmit={setLicenseKey} />
    </div>
  );
}
