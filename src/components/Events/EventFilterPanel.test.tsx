import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventFilterPanel, { EventFilterPanelProps } from "./EventFilterPanel";

function makeProps(overrides: Partial<EventFilterPanelProps> = {}): EventFilterPanelProps {
  return {
    dateRange: "7d", setDateRange: vi.fn(),
    customStart: "", setCustomStart: vi.fn(),
    customEnd: "", setCustomEnd: vi.fn(),
    typeFilter: "all", setTypeFilter: vi.fn(),
    severityFilter: "all", setSeverityFilter: vi.fn(),
    cameraFilter: "", setCameraFilter: vi.fn(),
    sortOrder: "newest", setSortOrder: vi.fn(),
    searchFilter: "",
    cameraOptions: ["CAM-01", "CAM-02"],
    typeOptions: ["fall", "intrusion"],
    onClose: vi.fn(),
    onClearAll: vi.fn(),
    ...overrides,
  };
}

describe("EventFilterPanel", () => {
  it("does not show Clear all when nothing is filtered", () => {
    render(<EventFilterPanel {...makeProps()} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("shows Clear all when a filter is active and calls onClearAll when clicked", async () => {
    const onClearAll = vi.fn();
    render(<EventFilterPanel {...makeProps({ typeFilter: "fall", onClearAll })} />);
    const clearBtn = screen.getByText("Clear all");
    expect(clearBtn).toBeInTheDocument();
    await userEvent.click(clearBtn);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<EventFilterPanel {...makeProps({ onClose })} />);
    await userEvent.click(screen.getByLabelText("Close filters"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<EventFilterPanel {...makeProps({ onClose })} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("only shows From/To date inputs when dateRange is custom", () => {
    const { rerender } = render(<EventFilterPanel {...makeProps({ dateRange: "7d" })} />);
    expect(screen.queryByText("From")).not.toBeInTheDocument();

    rerender(<EventFilterPanel {...makeProps({ dateRange: "custom" })} />);
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
  });

  it("shows a warning when the custom From date is after the To date", () => {
    render(
      <EventFilterPanel
        {...makeProps({ dateRange: "custom", customStart: "2026-09-10", customEnd: "2026-09-01" })}
      />,
    );
    expect(screen.getByText(/must be before/i)).toBeInTheDocument();
  });

  it("does not show a warning when the custom range is valid", () => {
    render(
      <EventFilterPanel
        {...makeProps({ dateRange: "custom", customStart: "2026-09-01", customEnd: "2026-09-10" })}
      />,
    );
    expect(screen.queryByText(/must be before/i)).not.toBeInTheDocument();
  });

  it("renders camera and type options passed in as props", () => {
    render(<EventFilterPanel {...makeProps()} />);
    expect(screen.getByText("CAM-01")).toBeInTheDocument();
    expect(screen.getByText("CAM-02")).toBeInTheDocument();
    expect(screen.getByText("Fall")).toBeInTheDocument();
    expect(screen.getByText("Intrusion")).toBeInTheDocument();
  });

  it("calls the corresponding setter when a select value changes", async () => {
    const setSeverityFilter = vi.fn();
    render(<EventFilterPanel {...makeProps({ setSeverityFilter })} />);
    await userEvent.selectOptions(screen.getByDisplayValue("All Severities"), "critical");
    expect(setSeverityFilter).toHaveBeenCalledWith("critical");
  });
});
