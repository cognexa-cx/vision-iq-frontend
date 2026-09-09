import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonitoringMapView from "./MonitoringMapView";

describe("MonitoringMapView", () => {
  it("starts at 100% zoom with zoom-out and the Hand tool disabled", () => {
    render(<MonitoringMapView totalCameras={24} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeDisabled();
    expect(screen.getByLabelText("Pan tool")).toBeDisabled();
  });

  it("shows the real total camera count", () => {
    render(<MonitoringMapView totalCameras={7} />);
    expect(screen.getByText("Total Cameras: 7")).toBeInTheDocument();
  });

  it("increases the zoom percentage and enables zoom-out/Hand tool after zooming in", async () => {
    render(<MonitoringMapView totalCameras={24} />);
    await userEvent.click(screen.getByLabelText("Zoom in"));
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).not.toBeDisabled();
    expect(screen.getByLabelText("Pan tool")).not.toBeDisabled();
  });

  it("disables zoom-in once the max zoom is reached", async () => {
    render(<MonitoringMapView totalCameras={24} />);
    const zoomIn = screen.getByLabelText("Zoom in");
    for (let i = 0; i < 10; i++) {
      await userEvent.click(zoomIn);
    }
    expect(screen.getByText("250%")).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();
  });

  it("toggles aria-pressed on the Hand tool once panning is possible", async () => {
    render(<MonitoringMapView totalCameras={24} />);
    await userEvent.click(screen.getByLabelText("Zoom in"));
    const handButton = screen.getByLabelText("Pan tool");
    expect(handButton).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(handButton);
    expect(handButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the active zone's label when one is provided", () => {
    render(<MonitoringMapView totalCameras={24} activeZone={{ id: "z1", label: "Zone 03", cameras: [] }} />);
    expect(screen.getByText("Zone 03")).toBeInTheDocument();
  });
});
