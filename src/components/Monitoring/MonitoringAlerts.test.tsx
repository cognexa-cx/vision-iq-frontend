import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonitoringAlerts from "./MonitoringAlerts";
import { EventRecord } from "../../data/eventsData";

function makeEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: "e1",
    camera_id: "cam-1",
    type: "animal",
    severity: "medium",
    created_at: "2026-09-07T01:00:00Z",
    snapshot_path: null,
    ...overrides,
  };
}

describe("MonitoringAlerts", () => {
  it("shows an empty state when there are no events", () => {
    render(<MonitoringAlerts events={[]} onOpenDetails={vi.fn()} />);
    expect(screen.getByText(/no recent alerts/i)).toBeInTheDocument();
  });

  it("renders a card per event with camera label and formatted alert name", () => {
    const events = [makeEvent({ id: "e1", camera_name: "Camera 05", type: "fall" })];
    render(<MonitoringAlerts events={events} onOpenDetails={vi.fn()} />);
    expect(screen.getByText("Camera 05")).toBeInTheDocument();
    expect(screen.getByText("Fall Detection")).toBeInTheDocument();
  });

  it("caps the number of rendered alerts at 8 even with more events", () => {
    const events = Array.from({ length: 20 }, (_, i) => makeEvent({ id: `e${i}`, camera_id: `cam-${i}` }));
    render(<MonitoringAlerts events={events} onOpenDetails={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });

  it("calls onOpenDetails with the event, a 2-digit srNo, and a photoSrc when a card is clicked", async () => {
    const onOpenDetails = vi.fn();
    const event = makeEvent({ id: "e1", camera_name: "Camera 05" });
    render(<MonitoringAlerts events={[event]} onOpenDetails={onOpenDetails} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpenDetails).toHaveBeenCalledWith(
      expect.objectContaining({ event, srNo: "01", photoSrc: expect.any(String) }),
    );
  });
});
