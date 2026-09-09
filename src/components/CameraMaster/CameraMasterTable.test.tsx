import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CameraMasterTable from "./CameraMasterTable";
import type { Camera } from "../../types/camera";

const cameras: Camera[] = [
  { id: "c1", name: "Main Gate", rtsp_url: "rtsp://a", enabled: true },
  { id: "c2", name: "Warehouse B", rtsp_url: "rtsp://b", enabled: false },
];

describe("CameraMasterTable", () => {
  it("shows an empty state when there are no cameras", () => {
    render(<CameraMasterTable cameras={[]} draftTags={{}} onToggleTag={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no cameras yet/i)).toBeInTheDocument();
  });

  it("renders every camera's name and a zero-padded Sr.No.", () => {
    render(<CameraMasterTable cameras={cameras} draftTags={{}} onToggleTag={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Main Gate")).toBeInTheDocument();
    expect(screen.getByText("Warehouse B")).toBeInTheDocument();
    expect(screen.getByText("01.")).toBeInTheDocument();
    expect(screen.getByText("02.")).toBeInTheDocument();
  });

  it("reflects each camera's draft tags as checked checkboxes", () => {
    render(
      <CameraMasterTable
        cameras={cameras}
        draftTags={{ c1: ["animal_detection"], c2: [] }}
        onToggleTag={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Animal Detection for Main Gate")).toBeChecked();
    expect(screen.getByLabelText("Crowd Detection for Main Gate")).not.toBeChecked();
    expect(screen.getByLabelText("Animal Detection for Warehouse B")).not.toBeChecked();
  });

  it("shows a live usage count per detection type in the header", () => {
    render(
      <CameraMasterTable
        cameras={cameras}
        draftTags={{ c1: ["animal_detection"], c2: ["animal_detection"] }}
        onToggleTag={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("(2/10)")).toBeInTheDocument();
    expect(screen.getAllByText("(0/10)")).toHaveLength(2);
  });

  it("calls onToggleTag with the camera id, type key, and new checked state", async () => {
    const onToggleTag = vi.fn();
    render(<CameraMasterTable cameras={cameras} draftTags={{ c1: [], c2: [] }} onToggleTag={onToggleTag} onEdit={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByLabelText("Crowd Detection for Main Gate"));
    expect(onToggleTag).toHaveBeenCalledWith("c1", "crowd_detection", true);
  });

  it("disables unchecked checkboxes for a type once its quota is reached", () => {
    // 10 cameras already at the animal_detection limit (max is 10).
    const manyCameras: Camera[] = Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, name: `Cam ${i}`, rtsp_url: "rtsp://x", enabled: true }));
    const manyDraft = Object.fromEntries(manyCameras.map((c) => [c.id, ["animal_detection"]]));
    render(
      <CameraMasterTable
        cameras={[...manyCameras, cameras[1]]}
        draftTags={{ ...manyDraft, c2: [] }}
        onToggleTag={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Animal Detection for Warehouse B")).toBeDisabled();
  });

  it("calls onEdit / onDelete with the right camera when their buttons are clicked", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<CameraMasterTable cameras={cameras} draftTags={{}} onToggleTag={vi.fn()} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Edit Main Gate"));
    expect(onEdit).toHaveBeenCalledWith(cameras[0]);
    await userEvent.click(screen.getByLabelText("Delete Warehouse B"));
    expect(onDelete).toHaveBeenCalledWith(cameras[1]);
  });
});
