import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventsPagination from "./EventsPagination";

describe("EventsPagination", () => {
  it("renders nothing when there's only one page", () => {
    const { container } = render(
      <EventsPagination currentPage={1} totalPages={1} totalItems={5} itemsPerPage={20} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the correct item range and total", () => {
    render(<EventsPagination currentPage={2} totalPages={3} totalItems={45} itemsPerPage={20} onPageChange={vi.fn()} />);
    expect(screen.getByText("21–40")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("disables Prev on the first page and Next on the last page", () => {
    render(<EventsPagination currentPage={1} totalPages={2} totalItems={40} itemsPerPage={20} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled(); // Prev
    expect(buttons[buttons.length - 1]).not.toBeDisabled(); // Next
  });

  it("calls onPageChange with the clicked page number", async () => {
    const onPageChange = vi.fn();
    render(<EventsPagination currentPage={1} totalPages={3} totalItems={60} itemsPerPage={20} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText("2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with currentPage + 1 when Next is clicked", async () => {
    const onPageChange = vi.fn();
    render(<EventsPagination currentPage={1} totalPages={3} totalItems={60} itemsPerPage={20} onPageChange={onPageChange} />);
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[buttons.length - 1]); // Next
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("collapses a long page range with an ellipsis", () => {
    render(<EventsPagination currentPage={5} totalPages={10} totalItems={200} itemsPerPage={20} onPageChange={vi.fn()} />);
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
