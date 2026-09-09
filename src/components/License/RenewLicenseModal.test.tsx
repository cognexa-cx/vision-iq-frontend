import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RenewLicenseModal from "./RenewLicenseModal";

describe("RenewLicenseModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<RenewLicenseModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a validation error and does not submit when the key is empty", async () => {
    const onSubmit = vi.fn();
    render(<RenewLicenseModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByText("Activate"));
    expect(screen.getByText(/enter a license key/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the trimmed key and closes on success", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<RenewLicenseModal open onClose={onClose} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText("VQ-XXXX-XXXX-XXXX-XXXX"), "  NEW-KEY-123  ");
    await userEvent.click(screen.getByText("Activate"));
    expect(onSubmit).toHaveBeenCalledWith("NEW-KEY-123");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(<RenewLicenseModal open onClose={onClose} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("resets the input each time it reopens", () => {
    const { rerender } = render(<RenewLicenseModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    rerender(<RenewLicenseModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText("VQ-XXXX-XXXX-XXXX-XXXX")).toHaveValue("");
  });
});
