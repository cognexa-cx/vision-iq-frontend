import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LicenseStatusBadge from "./LicenseStatusBadge";

describe("LicenseStatusBadge", () => {
  it.each(["Active", "Expiring Soon", "Expired"] as const)("renders the '%s' label", (status) => {
    render(<LicenseStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });
});
