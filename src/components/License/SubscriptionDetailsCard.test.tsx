import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SubscriptionDetailsCard from "./SubscriptionDetailsCard";
import { DETECTION_TYPES } from "../../data/cameraMasterData";
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

describe("SubscriptionDetailsCard", () => {
  it("shows the purchase order and formatted subscription date", () => {
    render(<SubscriptionDetailsCard info={info} />);
    expect(screen.getByText("PO-2026-00147")).toBeInTheDocument();
    expect(screen.getByText("12-01-2026")).toBeInTheDocument();
  });

  it("lists every licensed solution by name", () => {
    render(<SubscriptionDetailsCard info={info} />);
    DETECTION_TYPES.forEach((t) => {
      expect(screen.getByText(t.label)).toBeInTheDocument();
    });
    expect(screen.getByText(`${DETECTION_TYPES.length} Licensed Solutions`)).toBeInTheDocument();
  });
});
