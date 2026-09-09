import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventsPage from "./EventsPage";

vi.mock("../api/events", () => ({
  getEvents: vi.fn().mockRejectedValue(new Error("backend unreachable")),
}));

function setUrl(search: string) {
  window.history.pushState(null, "", `/${search}`);
}

describe("EventsPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setUrl("");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("falls back to sample data and renders rows when the backend is unreachable", async () => {
    render(<EventsPage />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "" }).length).toBeGreaterThan(0));
    expect(screen.getByLabelText("Search events")).toBeInTheDocument();
  });

  it("reads initial filter state from the URL query string", async () => {
    setUrl("?type=fall&search=cam&sort=oldest&page=2");
    render(<EventsPage />);
    await waitFor(() => expect(screen.getByLabelText("Search events")).toHaveValue("cam"));
  });

  it("typing in the search box filters results and updates the URL", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EventsPage />);
    await waitFor(() => screen.getByLabelText("Search events"));

    await user.type(screen.getByLabelText("Search events"), "zzz-no-match");

    await waitFor(() => {
      expect(window.location.search).toContain("search=zzz-no-match");
    });
    expect(screen.getByText(/no events found/i)).toBeInTheDocument();
  });

  it("shows the active-filter badge and Clear all only once a filter is applied", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EventsPage />);
    await waitFor(() => screen.getByLabelText("Search events"));

    expect(screen.queryByLabelText("Filters active")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Search events"), "cam");
    expect(screen.getByLabelText("Filters active")).toBeInTheDocument();

    await user.click(screen.getByText("Filter"));
    const clearAll = await screen.findByText("Clear all");
    await user.click(clearAll);

    expect(screen.getByLabelText("Search events")).toHaveValue("");
    expect(screen.queryByLabelText("Filters active")).not.toBeInTheDocument();
  });
});
