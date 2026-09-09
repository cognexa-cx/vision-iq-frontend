import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SupportSection from "./SupportSection";
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

describe("SupportSection", () => {
  it("shows the support tier and contact details", () => {
    render(<SupportSection info={info} />);
    expect(screen.getByText(info.supportTier)).toBeInTheDocument();
    expect(screen.getByText(info.supportEmail)).toBeInTheDocument();
    expect(screen.getByText(info.supportPhone)).toBeInTheDocument();
  });

  it("links the email and phone with real mailto:/tel: hrefs", () => {
    render(<SupportSection info={info} />);
    expect(screen.getByText(info.supportEmail).closest("a")).toHaveAttribute("href", `mailto:${info.supportEmail}`);
    expect(screen.getByText(info.supportPhone).closest("a")).toHaveAttribute("href", "tel:+911234567890");
  });

  it("links the knowledge base to the configured URL", () => {
    render(<SupportSection info={info} />);
    expect(screen.getByText("Visit Knowledge Base").closest("a")).toHaveAttribute("href", info.knowledgeBaseUrl);
  });

  it("builds a Raise a Ticket mailto link with a subject", () => {
    render(<SupportSection info={info} />);
    const href = screen.getByText("Raise a Ticket").closest("a")?.getAttribute("href");
    expect(href).toContain(`mailto:${info.supportEmail}`);
    expect(href).toContain("subject=");
  });
});
