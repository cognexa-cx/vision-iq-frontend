import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LogsTable from "./LogsTable";
import type { LogEntry } from "../../data/logsData";

const logs: LogEntry[] = [
  { id: "1", time: "2026-09-07T01:00:00", eventType: "Login", description: "Admin signed in", status: "Success", category: "User Activity" },
  { id: "2", time: "2026-09-06T17:45:00", eventType: "Login", description: "Failed login attempt", status: "Failed", category: "User Activity" },
];

describe("LogsTable", () => {
  it("shows an empty state when there are no logs", () => {
    render(<LogsTable logs={[]} />);
    expect(screen.getByText(/no logs found/i)).toBeInTheDocument();
  });

  it("renders every log's event type, description, formatted time, and status", () => {
    render(<LogsTable logs={logs} />);
    expect(screen.getAllByText("Login")).toHaveLength(2);
    expect(screen.getByText("Admin signed in")).toBeInTheDocument();
    expect(screen.getByText("07-09-2026 01:00am")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
