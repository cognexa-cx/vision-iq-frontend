import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonitoringGridView from "./MonitoringGridView";
import { ZoneRecord } from "../../data/monitoringData";

const zones: ZoneRecord[] = [
  {
    id: "z1",
    label: "Zone 01",
    cameras: [
      { id: "cam-1", name: "CAM-01-1", enabled: true },
      { id: "cam-2", name: "CAM-01-2", enabled: false },
    ],
  },
  {
    id: "z2",
    label: "Zone 02",
    cameras: [{ id: "cam-3", name: "CAM-02-1", enabled: true }],
  },
];

describe("MonitoringGridView", () => {
  it("shows an empty state when there are no zones", () => {
    render(<MonitoringGridView zones={[]} onSelectZone={vi.fn()} />);
    expect(screen.getByText(/no zones configured/i)).toBeInTheDocument();
  });

  it("renders every zone's label and online/total count, collapsed by default", () => {
    render(<MonitoringGridView zones={zones} onSelectZone={vi.fn()} />);
    expect(screen.getByText("Zone 01")).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === "1/2 online")).toBeInTheDocument();
    expect(screen.getByText("Zone 02")).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === "1/1 online")).toBeInTheDocument();
    expect(screen.queryByText("CAM-01-1")).not.toBeInTheDocument();
  });

  it("expands a zone to show its cameras when its header is clicked", async () => {
    render(<MonitoringGridView zones={zones} onSelectZone={vi.fn()} />);
    await userEvent.click(screen.getByText("Zone 01"));
    expect(screen.getByText("CAM-01-1")).toBeInTheDocument();
    expect(screen.getByText("CAM-01-2")).toBeInTheDocument();
    expect(screen.queryByText("CAM-02-1")).not.toBeInTheDocument();
  });

  it("shows Online/Offline per camera based on its enabled flag", async () => {
    render(<MonitoringGridView zones={zones} onSelectZone={vi.fn()} />);
    await userEvent.click(screen.getByText("Zone 01"));
    expect(screen.getAllByText("Online")).toHaveLength(1);
    expect(screen.getAllByText("Offline")).toHaveLength(1);
  });

  it("collapses a zone again when its header is clicked twice", async () => {
    render(<MonitoringGridView zones={zones} onSelectZone={vi.fn()} />);
    const header = screen.getByText("Zone 01");
    await userEvent.click(header);
    expect(screen.getByText("CAM-01-1")).toBeInTheDocument();
    await userEvent.click(header);
    expect(screen.queryByText("CAM-01-1")).not.toBeInTheDocument();
  });

  it("calls onSelectZone with the parent zone when a camera thumbnail is clicked", async () => {
    const onSelectZone = vi.fn();
    render(<MonitoringGridView zones={zones} onSelectZone={onSelectZone} />);
    await userEvent.click(screen.getByText("Zone 01"));
    await userEvent.click(screen.getByText("CAM-01-1"));
    expect(onSelectZone).toHaveBeenCalledWith(zones[0]);
  });
});
