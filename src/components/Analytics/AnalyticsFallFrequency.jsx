import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = {
  falls: "#EF4444",
  alerts: "#F59E0B",
  resolved: "#10B981",
};

const LEGEND = [
  { key: "falls", label: "Falls", color: COLORS.falls },
  { key: "alerts", label: "Alerts", color: COLORS.alerts },
  { key: "resolved", label: "Resolved", color: COLORS.resolved },
];

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-lg text-xs min-w-[130px]">
      <p className="text-gray-500 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-3 mb-1"
        >
          <span className="flex items-center gap-1.5 text-gray-600 capitalize">
            <span
              className="w-2 h-2 rounded-sm inline-block flex-shrink-0"
              style={{ background: p.fill }}
            />
            {p.dataKey}
          </span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1.5 pt-1.5 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-bold text-gray-700">{total}</span>
      </div>
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex-1 flex flex-col justify-end gap-2 animate-pulse px-2">
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div key={i} className="flex items-end gap-1">
          <div className="w-10 h-2.5 rounded-full bg-gray-100 mr-1" />
          <div className="flex-1 rounded-t bg-gray-100" style={{ height: h }} />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
      <span className="text-3xl">🩺</span>
      <p className="text-xs text-gray-400">No fall event data available</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
// Props:
//   data    — ai.fall_frequency  [{ time, falls, alerts, resolved }]
//   loading — boolean
const AnalyticsFallFrequency = ({ data, loading }) => {
  // Group raw time-series into per-day buckets
  const mapped = useMemo(() => {
    const grouped = {};
    (data ?? []).forEach((d) => {
      let day;
      try {
        day = new Date(d.time).toLocaleDateString([], {
          day: "numeric",
          month: "short",
        });
      } catch {
        day = String(d.time);
      }
      if (!grouped[day])
        grouped[day] = { date: day, falls: 0, alerts: 0, resolved: 0 };
      grouped[day].falls += d.falls ?? 0;
      grouped[day].alerts += d.alerts ?? 0;
      grouped[day].resolved += d.resolved ?? 0;
    });
    return Object.values(grouped);
  }, [data]);

  const isEmpty = !loading && mapped.length === 0;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col"
      style={{ border: "1px solid #0085D44D", minHeight: 280 }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Fall Events</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Daily breakdown</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {LEGEND.map(({ key, label, color }) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      {loading && !data?.length ? (
        <Skeleton />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mapped}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f9fafb" }}
              />

              {/* Stacked — same stackId so bars stack on top of each other */}
              <Bar
                dataKey="falls"
                stackId="stack"
                fill={COLORS.falls}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="alerts"
                stackId="stack"
                fill={COLORS.alerts}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="resolved"
                stackId="stack"
                fill={COLORS.resolved}
                radius={[4, 4, 0, 0]} /* rounded top on last bar only */
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalyticsFallFrequency;
