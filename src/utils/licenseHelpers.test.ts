import { describe, it, expect } from "vitest";
import { computeDaysRemaining, computeLicenseStatus, computeElapsedPercent, maskLicenseKey } from "./licenseHelpers";

describe("computeDaysRemaining", () => {
  it("returns the whole number of days until validTill", () => {
    const now = new Date("2026-01-01T00:00:00");
    expect(computeDaysRemaining("2026-01-11T00:00:00", now)).toBe(10);
  });

  it("returns 0 on the exact expiry moment", () => {
    const now = new Date("2026-01-11T00:00:00");
    expect(computeDaysRemaining("2026-01-11T00:00:00", now)).toBe(0);
  });

  it("returns a negative number once past validTill", () => {
    const now = new Date("2026-01-15T00:00:00");
    expect(computeDaysRemaining("2026-01-11T00:00:00", now)).toBeLessThan(0);
  });
});

describe("computeLicenseStatus", () => {
  it("is 'Active' when well within the license period", () => {
    expect(computeLicenseStatus(200)).toBe("Active");
  });

  it("is 'Expiring Soon' at exactly the 30-day threshold", () => {
    expect(computeLicenseStatus(30)).toBe("Expiring Soon");
  });

  it("is 'Expiring Soon' just under the threshold", () => {
    expect(computeLicenseStatus(1)).toBe("Expiring Soon");
  });

  it("is 'Active' just over the threshold", () => {
    expect(computeLicenseStatus(31)).toBe("Active");
  });

  it("is 'Expired' once days remaining goes negative", () => {
    expect(computeLicenseStatus(-1)).toBe("Expired");
  });
});

describe("computeElapsedPercent", () => {
  it("is 0 at the start date", () => {
    const now = new Date("2026-01-01T00:00:00");
    expect(computeElapsedPercent("2026-01-01T00:00:00", "2026-01-11T00:00:00", now)).toBe(0);
  });

  it("is 100 at validTill", () => {
    const now = new Date("2026-01-11T00:00:00");
    expect(computeElapsedPercent("2026-01-01T00:00:00", "2026-01-11T00:00:00", now)).toBe(100);
  });

  it("is 50 exactly halfway through", () => {
    const now = new Date("2026-01-06T00:00:00");
    expect(computeElapsedPercent("2026-01-01T00:00:00", "2026-01-11T00:00:00", now)).toBe(50);
  });

  it("clamps to 100 once past validTill", () => {
    const now = new Date("2026-02-01T00:00:00");
    expect(computeElapsedPercent("2026-01-01T00:00:00", "2026-01-11T00:00:00", now)).toBe(100);
  });

  it("clamps to 0 before the start date", () => {
    const now = new Date("2025-12-01T00:00:00");
    expect(computeElapsedPercent("2026-01-01T00:00:00", "2026-01-11T00:00:00", now)).toBe(0);
  });
});

describe("maskLicenseKey", () => {
  it("masks every group except the last", () => {
    expect(maskLicenseKey("VQ-8F2K-91LM-QX7T-3ZC5")).toBe("••-••••-••••-••••-3ZC5");
  });

  it("masks every character for a key with no dashes", () => {
    expect(maskLicenseKey("ABCDEF")).toBe("••••••");
  });
});
