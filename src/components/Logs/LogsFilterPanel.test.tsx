import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogsFilterPanel from "./LogsFilterPanel";

describe("LogsFilterPanel", () => {
  it("hides Clear all when isFiltered is false", () => {
    render(<LogsFilterPanel status="all" setStatus={vi.fn()} onClose={vi.fn()} onClearAll={vi.fn()} isFiltered={false} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("shows Clear all when isFiltered is true and calls onClearAll when clicked", async () => {
    const onClearAll = vi.fn();
    render(<LogsFilterPanel status="Failed" setStatus={vi.fn()} onClose={vi.fn()} onClearAll={onClearAll} isFiltered />);
    await userEvent.click(screen.getByText("Clear all"));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<LogsFilterPanel status="all" setStatus={vi.fn()} onClose={onClose} onClearAll={vi.fn()} isFiltered={false} />);
    await userEvent.click(screen.getByLabelText("Close filters"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", async () => {
    const onClose = vi.fn();
    render(<LogsFilterPanel status="all" setStatus={vi.fn()} onClose={onClose} onClearAll={vi.fn()} isFiltered={false} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls setStatus when the status select changes", async () => {
    const setStatus = vi.fn();
    render(<LogsFilterPanel status="all" setStatus={setStatus} onClose={vi.fn()} onClearAll={vi.fn()} isFiltered={false} />);
    await userEvent.selectOptions(screen.getByDisplayValue("All Statuses"), "Failed");
    expect(setStatus).toHaveBeenCalledWith("Failed");
  });
});
