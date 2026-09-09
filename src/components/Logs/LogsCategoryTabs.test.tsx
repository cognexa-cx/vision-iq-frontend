import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogsCategoryTabs from "./LogsCategoryTabs";

describe("LogsCategoryTabs", () => {
  it("renders all four categories", () => {
    render(<LogsCategoryTabs active="Systems" onChange={vi.fn()} />);
    expect(screen.getByText("Systems")).toBeInTheDocument();
    expect(screen.getByText("Detection")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("User Activity")).toBeInTheDocument();
  });

  it("marks the active category with aria-pressed", () => {
    render(<LogsCategoryTabs active="Error" onChange={vi.fn()} />);
    expect(screen.getByText("Error")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Systems")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked category", async () => {
    const onChange = vi.fn();
    render(<LogsCategoryTabs active="Systems" onChange={onChange} />);
    await userEvent.click(screen.getByText("User Activity"));
    expect(onChange).toHaveBeenCalledWith("User Activity");
  });
});
