// src/components/Logs/LogsTable.tsx
import { LogEntry, STATUS_COLORS } from "../../data/logsData";
import { formatLogTime } from "../../utils/logsHelpers";

export interface LogsTableProps {
  logs: LogEntry[];
}

const headerCellCls = "px-4 text-xs font-semibold whitespace-nowrap";
const rowCellCls = "px-4 py-2.5 text-sm";

export default function LogsTable({ logs }: LogsTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-auto themed-scrollbar">
      <table className="text-left" style={{ tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: 700 }}>
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "38%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead style={{ position: "sticky", top: 0, background: "#F8F8FE", zIndex: 1 }}>
          <tr style={{ height: 44 }}>
            <th className={`${headerCellCls} pl-6`} style={{ color: "#003473" }}>Time</th>
            <th className={headerCellCls} style={{ color: "#003473" }}>Event Type</th>
            <th className={headerCellCls} style={{ color: "#003473" }}>Description</th>
            <th className={`${headerCellCls} pr-6`} style={{ color: "#003473" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-8 py-16 text-center text-gray-400 text-sm">
                No logs found for the current filters.
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const sev = STATUS_COLORS[log.status];
              return (
                <tr key={log.id} className="border-t" style={{ borderColor: "#F0F0F0" }}>
                  <td className={`${rowCellCls} pl-6`} style={{ color: "#00183E" }}>{formatLogTime(log.time)}</td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>{log.eventType}</td>
                  <td className={`${rowCellCls} truncate`} style={{ color: "#00183E" }}>{log.description}</td>
                  <td className={`${rowCellCls} pr-6`}>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: sev.bg, color: sev.text }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
