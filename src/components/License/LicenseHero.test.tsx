import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LicenseHero from "./LicenseHero";
import type { LicenseInfo } from "../../data/licenseData";

const info: LicenseInfo = {
  companyName: "DAccess Security Systems Pvt. Ltd",
  purchaseOrder: "PO-2026-00147",
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

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe("LicenseHero", () => {
  it("shows the company name, plan, and days remaining", () => {
    render(<LicenseHero info={info} status="Active" daysRemaining={124} />);
    expect(screen.getByText(info.companyName)).toBeInTheDocument();
    expect(screen.getByText(info.planName)).toBeInTheDocument();
    expect(screen.getByText("124")).toBeInTheDocument();
  });

  it("shows 'Expired' instead of a negative number once past validTill", () => {
    render(<LicenseHero info={info} status="Expired" daysRemaining={-5} />);
    // "Expired" appears twice here: once in the status badge, once as the
    // Days Remaining value — both are expected, so assert the count.
    expect(screen.getAllByText("Expired")).toHaveLength(2);
    expect(screen.queryByText("-5")).not.toBeInTheDocument();
  });

  it("masks the license key by default and reveals it on toggle", async () => {
    render(<LicenseHero info={info} status="Active" daysRemaining={124} />);
    expect(screen.queryByText(info.licenseKey)).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Reveal license key"));
    expect(screen.getByText(info.licenseKey)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Hide license key"));
    expect(screen.queryByText(info.licenseKey)).not.toBeInTheDocument();
  });

  it("copies the real license key to the clipboard", async () => {
    render(<LicenseHero info={info} status="Active" daysRemaining={124} />);
    await userEvent.click(screen.getByLabelText("Copy license key"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(info.licenseKey);
  });
});
