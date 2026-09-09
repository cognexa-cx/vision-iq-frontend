// src/data/licenseData.ts
// No subscription/license/billing API exists anywhere on the backend (same
// finding as Camera Master's quota system) — this is the plan's static
// configuration, standing in for what a real license service would return.
// Camera counts and per-analytics usage are NOT duplicated here — they're
// pulled live from the same real camera data Camera Master uses, so the two
// pages never disagree with each other.
export interface LicenseInfo {
  companyName: string;
  purchaseOrder: string;
  subscriptionDate: string; // ISO date
  planName: string;
  licenseKey: string;
  startDate: string; // ISO date
  validTill: string; // ISO date
  supportEmail: string;
  supportPhone: string;
  supportTier: string;
  knowledgeBaseUrl: string;
}

export const LICENSE_INFO: LicenseInfo = {
  companyName: "DAccess Security Systems Pvt. Ltd",
  purchaseOrder: "PO-2026-00147",
  // Local-time (no "Z") so date-only formatting/day-diff math can't shift a
  // day off depending on the viewer's timezone — same convention used for
  // sample dates elsewhere in this app.
  subscriptionDate: "2026-01-12T00:00:00",
  planName: "Enterprise Plan",
  licenseKey: "VQ-8F2K-91LM-QX7T-3ZC5",
  startDate: "2026-01-12T00:00:00",
  validTill: "2027-01-11T00:00:00",
  supportEmail: "support@daccess.co",
  supportPhone: "+91 12345 67890",
  supportTier: "Priority (24×7)",
  knowledgeBaseUrl: "https://daccess.co/support",
};

export type LicenseStatus = "Active" | "Expiring Soon" | "Expired";

export const LICENSE_STATUS_COLORS: Record<LicenseStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "#DCFCE7", text: "#166534", dot: "#22C55E" },
  "Expiring Soon": { bg: "#FFEDD5", text: "#C2410C", dot: "#F97316" },
  Expired: { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
};

// A license inside this window is flagged "Expiring Soon" rather than a
// plain "Active" — gives the user a heads-up before it lapses.
export const EXPIRING_SOON_THRESHOLD_DAYS = 30;
