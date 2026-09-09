import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CameraFormModal from "./CameraFormModal";
import type { Camera } from "../../types/camera";

const camera: Camera = { id: "c1", name: "Main Gate", rtsp_url: "rtsp://old", enabled: true };

describe("CameraFormModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<CameraFormModal open={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'Add Camera' with empty fields when there's no camera", () => {
    render(<CameraFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Add Camera", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Main Gate")).toHaveValue("");
  });

  it("shows 'Edit Camera' pre-filled with the camera's values", () => {
    render(<CameraFormModal open camera={camera} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText("Edit Camera")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Main Gate")).toHaveValue("Main Gate");
    expect(screen.getByPlaceholderText(/rtsp:\/\//)).toHaveValue("rtsp://old");
  });

  it("shows a validation error and does not submit when a field is empty", async () => {
    const onSubmit = vi.fn();
    render(<CameraFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByText("Add Camera", { selector: "button" }));
    expect(screen.getByText(/both required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed name/rtsp_url and closes on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<CameraFormModal open onClose={onClose} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText("e.g. Main Gate"), "  Main Gate  ");
    await userEvent.type(screen.getByPlaceholderText(/rtsp:\/\//), "  rtsp://new  ");
    await userEvent.click(screen.getByText("Add Camera", { selector: "button" }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "Main Gate", rtsp_url: "rtsp://new" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the submit error and does not close when onSubmit rejects", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Camera limit reached"));
    const onClose = vi.fn();
    render(<CameraFormModal open onClose={onClose} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText("e.g. Main Gate"), "Main Gate");
    await userEvent.type(screen.getByPlaceholderText(/rtsp:\/\//), "rtsp://new");
    await userEvent.click(screen.getByText("Add Camera", { selector: "button" }));
    expect(await screen.findByText("Camera limit reached")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(<CameraFormModal open onClose={onClose} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
