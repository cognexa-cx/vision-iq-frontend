// src/utils/licenseHelpers.ts
// Pure helpers for the License page, pulled out of components so they're
// unit-testable without rendering React.
import { LicenseStatus, EXPIRING_SOON_THRESHOLD_DAYS } from "../data/licenseData";

/** Whole days between now and validTill — negative once expired. */
export function computeDaysRemaining(validTill: string, now: Date = new Date()): number {
  const end = new Date(validTill);
  const msPerDay = 86_400_000;
  return Math.ceil((end.getTime() - now.getTime()) / msPerDay);
}

export function computeLicenseStatus(daysRemaining: number): LicenseStatus {
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining <= EXPIRING_SOON_THRESHOLD_DAYS) return "Expiring Soon";
  return "Active";
}

/** How far through the start→validTill window "now" is, as 0-100 (clamped). */
export function computeElapsedPercent(startDate: string, validTill: string, now: Date = new Date()): number {
  const start = new Date(startDate).getTime();
  const end = new Date(validTill).getTime();
  if (end <= start) return 100;
  const pct = ((now.getTime() - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/** Masks all but the last group, e.g. "VQ-8F2K-91LM-QX7T-3ZC5" -> "••••-••••-••••-••••-3ZC5". */
export function maskLicenseKey(key: string): string {
  const groups = key.split("-");
  if (groups.length <= 1) return key.replace(/./g, "•");
  return groups.map((g, i) => (i === groups.length - 1 ? g : "•".repeat(g.length))).join("-");
}
