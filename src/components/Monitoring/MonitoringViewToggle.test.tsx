import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonitoringViewToggle from "./MonitoringViewToggle";

describe("MonitoringViewToggle", () => {
  it("reflects 'map' as the unchecked state", () => {
    render(<MonitoringViewToggle view="map" onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("reflects 'grid' as the checked state", () => {
    render(<MonitoringViewToggle view="grid" onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with 'grid' when the switch is clicked from map view", async () => {
    const onChange = vi.fn();
    render(<MonitoringViewToggle view="map" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("grid");
  });

  it("calls onChange with 'map' when the switch is clicked from grid view", async () => {
    const onChange = vi.fn();
    render(<MonitoringViewToggle view="grid" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("map");
  });

  it("calls onChange when the 'Map view' label is clicked directly", async () => {
    const onChange = vi.fn();
    render(<MonitoringViewToggle view="grid" onChange={onChange} />);
    await userEvent.click(screen.getByText("Map view"));
    expect(onChange).toHaveBeenCalledWith("map");
  });

  it("calls onChange when the 'Grid View' label is clicked directly", async () => {
    const onChange = vi.fn();
    render(<MonitoringViewToggle view="map" onChange={onChange} />);
    await userEvent.click(screen.getByText("Grid View"));
    expect(onChange).toHaveBeenCalledWith("grid");
  });
});
