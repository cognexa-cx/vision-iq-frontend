import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonitoringAlertModal from "./MonitoringAlertModal";
import { EventRecord } from "../../data/eventsData";

const event: EventRecord = {
  id: "e1",
  camera_id: "cam-1",
  camera_name: "Camera 05",
  type: "fall",
  severity: "high",
  zone_no: "03",
  created_at: "2026-09-07T13:00:00",
  snapshot_path: null,
};

describe("MonitoringAlertModal", () => {
  it("renders nothing when there's no event", () => {
    const { container } = render(<MonitoringAlertModal event={undefined} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the camera and zone in the header", () => {
    render(<MonitoringAlertModal event={event} onClose={vi.fn()} />);
    expect(screen.getByText("Camera Camera 05 · Zone 03")).toBeInTheDocument();
  });

  it("shows the 4 key detail chips: Camera ID, Zone, Alert, Time", () => {
    render(<MonitoringAlertModal event={event} onClose={vi.fn()} />);
    expect(screen.getByText("Camera ID")).toBeInTheDocument();
    expect(screen.getByText("Zone")).toBeInTheDocument();
    expect(screen.getByText("Alert")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Fall Detection")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("splits the Time chip into a time value and a date sub-value (no truncated combined string)", () => {
    render(<MonitoringAlertModal event={event} onClose={vi.fn()} />);
    expect(screen.getByText("01:00pm")).toBeInTheDocument();
    expect(screen.getByText("07-09-2026")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<MonitoringAlertModal event={event} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(<MonitoringAlertModal event={event} onClose={onClose} />);
    await userEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the modal content itself is clicked", async () => {
    const onClose = vi.fn();
    render(<MonitoringAlertModal event={event} onClose={onClose} />);
    await userEvent.click(screen.getByText("Live Alert"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
