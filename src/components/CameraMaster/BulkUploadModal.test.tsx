import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkUploadModal from "./BulkUploadModal";

function makeCsvFile(content: string) {
  return new File([content], "cameras.csv", { type: "text/csv" });
}

describe("BulkUploadModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<BulkUploadModal open={false} onClose={vi.fn()} onCreateCamera={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disables Upload until a valid file is chosen", () => {
    render(<BulkUploadModal open onClose={vi.fn()} onCreateCamera={vi.fn()} />);
    expect(screen.getByText("Upload")).toBeDisabled();
  });

  it("parses a chosen CSV and shows the row count", async () => {
    render(<BulkUploadModal open onClose={vi.fn()} onCreateCamera={vi.fn()} />);
    const file = makeCsvFile("name,rtsp_url\nMain Gate,rtsp://a\nWarehouse,rtsp://b");
    const input = document.getElementById("bulk-camera-csv") as HTMLInputElement;
    await userEvent.upload(input, file);
    expect(await screen.findByText(/2 cameras ready to import/i)).toBeInTheDocument();
    expect(screen.getByText("Upload")).not.toBeDisabled();
  });

  it("shows a parse error for a file with no valid rows", async () => {
    render(<BulkUploadModal open onClose={vi.fn()} onCreateCamera={vi.fn()} />);
    const file = makeCsvFile("just-a-name-no-comma\nanother-line-no-comma");
    const input = document.getElementById("bulk-camera-csv") as HTMLInputElement;
    await userEvent.upload(input, file);
    expect(await screen.findByText(/no valid rows found/i)).toBeInTheDocument();
  });

  it("calls onCreateCamera once per parsed row and reports the imported count", async () => {
    const onCreateCamera = vi.fn().mockResolvedValue(undefined);
    render(<BulkUploadModal open onClose={vi.fn()} onCreateCamera={onCreateCamera} />);
    const input = document.getElementById("bulk-camera-csv") as HTMLInputElement;
    await userEvent.upload(input, makeCsvFile("Main Gate,rtsp://a\nWarehouse,rtsp://b"));
    await screen.findByText(/2 cameras ready to import/i);
    await userEvent.click(screen.getByText("Upload"));
    expect(onCreateCamera).toHaveBeenCalledTimes(2);
    expect(onCreateCamera).toHaveBeenCalledWith({ name: "Main Gate", rtsp_url: "rtsp://a" });
    expect(await screen.findByText(/imported/i)).toBeInTheDocument();
  });

  it("counts failures separately when onCreateCamera rejects", async () => {
    const onCreateCamera = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("duplicate"));
    render(<BulkUploadModal open onClose={vi.fn()} onCreateCamera={onCreateCamera} />);
    const input = document.getElementById("bulk-camera-csv") as HTMLInputElement;
    await userEvent.upload(input, makeCsvFile("Main Gate,rtsp://a\nWarehouse,rtsp://b"));
    await screen.findByText(/2 cameras ready to import/i);
    await userEvent.click(screen.getByText("Upload"));
    expect(await screen.findByText(/1 failed/i)).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(<BulkUploadModal open onClose={onClose} onCreateCamera={vi.fn()} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
