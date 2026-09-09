import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CameraMasterActionsBar from "./CameraMasterActionsBar";

describe("CameraMasterActionsBar", () => {
  it("calls the right handler for each button", async () => {
    const onAddCamera = vi.fn();
    const onBulkUpload = vi.fn();
    const onDownloadTemplate = vi.fn();
    render(<CameraMasterActionsBar onAddCamera={onAddCamera} onBulkUpload={onBulkUpload} onDownloadTemplate={onDownloadTemplate} />);

    await userEvent.click(screen.getByText("Add Camera"));
    expect(onAddCamera).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText("Bulk Upload"));
    expect(onBulkUpload).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText("Download Template"));
    expect(onDownloadTemplate).toHaveBeenCalledTimes(1);
  });
});
