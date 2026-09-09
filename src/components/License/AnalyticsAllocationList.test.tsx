import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalyticsAllocationList from "./AnalyticsAllocationList";
import { DETECTION_TYPES } from "../../data/cameraMasterData";

describe("AnalyticsAllocationList", () => {
  it("shows the total cameras used/allowed badge", () => {
    render(<AnalyticsAllocationList usageByType={{}} camerasUsed={6} camerasAllowed={50} />);
    expect(screen.getByText("6 / 50 total")).toBeInTheDocument();
  });

  it("shows each detection type's real usage against its max", () => {
    const usageByType = { animal_detection: 2, crowd_detection: 0, intruder_detection: 3 };
    render(<AnalyticsAllocationList usageByType={usageByType} camerasUsed={6} camerasAllowed={50} />);
    expect(screen.getByText("2 / 10")).toBeInTheDocument();
    expect(screen.getByText("0 / 10")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
    DETECTION_TYPES.forEach((t) => expect(screen.getByText(t.label)).toBeInTheDocument());
  });

  it("defaults to 0 for a type missing from usageByType", () => {
    render(<AnalyticsAllocationList usageByType={{}} camerasUsed={0} camerasAllowed={50} />);
    expect(screen.getAllByText("0 / 10")).toHaveLength(DETECTION_TYPES.length);
  });
});
