import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CameraMasterStats from "./CameraMasterStats";

describe("CameraMasterStats", () => {
  it("renders all three labels", () => {
    render(<CameraMasterStats total={6} active={4} remaining={44} />);
    expect(screen.getByText("Total Cameras")).toBeInTheDocument();
    expect(screen.getByText("Active Cameras")).toBeInTheDocument();
    expect(screen.getByText("Remaining Cameras")).toBeInTheDocument();
  });

  it("zero-pads single-digit values", () => {
    render(<CameraMasterStats total={6} active={4} remaining={9} />);
    expect(screen.getByText("06")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("09")).toBeInTheDocument();
  });

  it("renders double-digit values without extra padding", () => {
    render(<CameraMasterStats total={12} active={8} remaining={44} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("44")).toBeInTheDocument();
  });
});
