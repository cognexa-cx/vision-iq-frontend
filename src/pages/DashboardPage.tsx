// src/pages/DashboardPage.jsx
// ⚠️  App.tsx: <DashboardPage isCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />

import React, { useState, useEffect } from "react";
import Footer from "../components/Common/Footer";

/* ── DETECTION TYPE CONFIG ─────────────────────────────────── */
const TC = {
  fall: { bg: "#FEE2E2", text: "#991B1B", bar: "#EF4444", name: "Fall" },
  ppe: {
    bg: "#FEF3C7",
    text: "#92400E",
    bar: "#F59E0B",
    name: "PPE Violation",
  },
  intrusion: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    bar: "#3B82F6",
    name: "Intrusion",
  },
  vehicle: { bg: "#DCFCE7", text: "#166534", bar: "#22C55E", name: "Vehicle" },
  animal: { bg: "#EDE9FE", text: "#5B21B6", bar: "#8B5CF6", name: "Animal" },
};

/* ── DATE RANGE OPTIONS ────────────────────────────────────── */
const RANGE_OPTIONS = [
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

/* ── ACTIVITY CHART DATA ────────────────────────────────────── */
const HOURLY = [
  { h: "00", n: 8, t: "vehicle" },
  { h: "01", n: 5, t: "vehicle" },
  { h: "02", n: 4, t: "intrusion" },
  { h: "03", n: 3, t: "animal" },
  { h: "04", n: 6, t: "vehicle" },
  { h: "05", n: 9, t: "ppe" },
  { h: "06", n: 18, t: "ppe" },
  { h: "07", n: 28, t: "ppe" },
  { h: "08", n: 35, t: "fall" },
  { h: "09", n: 42, t: "fall" },
  { h: "10", n: 38, t: "ppe" },
  { h: "11", n: 30, t: "vehicle" },
  { h: "12", n: 45, t: "vehicle" },
  { h: "13", n: 22, t: "intrusion" },
  { h: "14", n: 18, t: "ppe" },
  { h: "15", n: 25, t: "fall" },
  { h: "16", n: 32, t: "ppe" },
  { h: "17", n: 28, t: "ppe" },
  { h: "18", n: 20, t: "vehicle" },
  { h: "19", n: 15, t: "animal" },
  { h: "20", n: 12, t: "intrusion" },
  { h: "21", n: 10, t: "vehicle" },
  { h: "22", n: 8, t: "vehicle" },
  { h: "23", n: 5, t: "ppe" },
];

const LAST_7_DAYS = [
  { h: "Mon", n: 245, t: "ppe" },
  { h: "Tue", n: 198, t: "vehicle" },
  { h: "Wed", n: 312, t: "fall" },
  { h: "Thu", n: 287, t: "ppe" },
  { h: "Fri", n: 356, t: "vehicle" },
  { h: "Sat", n: 178, t: "intrusion" },
  { h: "Sun", n: 142, t: "animal" },
];

const TC_CYCLE = ["vehicle", "ppe", "fall", "intrusion", "animal"];
const LAST_30_DAYS = Array.from({ length: 30 }, (_, i) => ({
  h: `Day ${i + 1}`,
  n: 140 + Math.round(110 * Math.abs(Math.sin((i + 1) / 3))),
  t: TC_CYCLE[i % TC_CYCLE.length],
}));

const RANGES = {
  yesterday: {
    label: "Yesterday",
    data: HOURLY,
    axisLabels: ["00:00", "06:00", "12:00", "18:00", "23:59"],
    unitSuffix: ":00",
  },
  last7: {
    label: "Last 7 Days",
    data: LAST_7_DAYS,
    axisLabels: LAST_7_DAYS.map((d) => d.h),
    unitSuffix: "",
  },
  lastMonth: {
    label: "Last Month",
    data: LAST_30_DAYS,
    axisLabels: ["Day 1", "Day 8", "Day 15", "Day 22", "Day 30"],
    unitSuffix: "",
  },
  custom: {
    label: "Custom",
    data: LAST_7_DAYS, // TODO: wire to real date-range API
    axisLabels: LAST_7_DAYS.map((d) => d.h),
    unitSuffix: "",
  },
};

/* ── ALERTS ─────────────────────────────────────────────────── */
const ALERTS = [
  {
    id: 1,
    type: "fall",
    cam: "Cam 2",
    zone: "Warehouse B",
    time: "2m ago",
    acked: false,
  },
  {
    id: 2,
    type: "ppe",
    cam: "Cam 4",
    zone: "Loading Dock",
    time: "8m ago",
    acked: false,
  },
  {
    id: 3,
    type: "intrusion",
    cam: "Cam 1",
    zone: "Front Gate",
    time: "15m ago",
    acked: true,
  },
  {
    id: 4,
    type: "vehicle",
    cam: "Cam 7",
    zone: "Parking Lot",
    time: "22m ago",
    acked: true,
  },
  {
    id: 5,
    type: "fall",
    cam: "Cam 9",
    zone: "Server Room",
    time: "34m ago",
    acked: true,
  },
  {
    id: 6,
    type: "animal",
    cam: "Cam 3",
    zone: "Warehouse A",
    time: "41m ago",
    acked: true,
  },
];

/* ── ZONE DATA PER RANGE ────────────────────────────────────── */
const ZONES_YESTERDAY = [
  { name: "Loading Dock", events: 78, color: "#EF4444" },
  { name: "Warehouse B", events: 65, color: "#F59E0B" },
  { name: "Front Gate", events: 44, color: "#3B82F6" },
  { name: "Parking Lot", events: 38, color: "#22C55E" },
  { name: "Server Room", events: 22, color: "#F59E0B" },
  { name: "Office Block", events: 9, color: "#22C55E" },
];

const ZONES_LAST7 = [
  { name: "Loading Dock", events: 412, color: "#EF4444" },
  { name: "Warehouse B", events: 358, color: "#F59E0B" },
  { name: "Front Gate", events: 290, color: "#3B82F6" },
  { name: "Parking Lot", events: 245, color: "#22C55E" },
  { name: "Server Room", events: 156, color: "#F59E0B" },
  { name: "Office Block", events: 62, color: "#22C55E" },
];

const ZONES_LAST_MONTH = [
  { name: "Loading Dock", events: 1840, color: "#EF4444" },
  { name: "Warehouse B", events: 1520, color: "#F59E0B" },
  { name: "Front Gate", events: 1180, color: "#3B82F6" },
  { name: "Parking Lot", events: 980, color: "#22C55E" },
  { name: "Server Room", events: 640, color: "#F59E0B" },
  { name: "Office Block", events: 268, color: "#22C55E" },
];

const ZONES_BY_RANGE = {
  yesterday: ZONES_YESTERDAY,
  last7: ZONES_LAST7,
  lastMonth: ZONES_LAST_MONTH,
  custom: ZONES_LAST7, // TODO: wire to real date-range API
};

/* ── CAMERAS ─────────────────────────────────────────────────── */
const CAMERAS = [
  { id: "Cam 01", zone: "Main Entry", online: true },
  { id: "Cam 02", zone: "Warehouse B", online: true },
  { id: "Cam 03", zone: "Warehouse A", online: true },
  { id: "Cam 04", zone: "Loading Dock", online: false },
  { id: "Cam 05", zone: "Loading Dock", online: true },
  { id: "Cam 06", zone: "Front Gate", online: true },
  { id: "Cam 07", zone: "Parking Lot", online: true },
  { id: "Cam 08", zone: "Parking Lot", online: true },
  { id: "Cam 09", zone: "Server Room", online: true },
  { id: "Cam 10", zone: "Server Room", online: false },
  { id: "Cam 11", zone: "Office A", online: true },
  { id: "Cam 12", zone: "Office B", online: true },
  { id: "Cam 13", zone: "Rooftop", online: true },
  { id: "Cam 14", zone: "Basement", online: true },
  { id: "Cam 15", zone: "Canteen", online: true },
  { id: "Cam 16", zone: "Reception", online: true },
];

const SPARK = [180, 210, 195, 240, 225, 270, 312];

/* ── SHARED CARD ─────────────────────────────────────────────── */
const Card = ({ children, className = "", style = {} }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}
    style={style}
  >
    {children}
  </div>
);

/* ── SPARKLINE ───────────────────────────────────────────────── */
const Sparkline = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const r = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 56;
      const y = 18 - ((v - min) / r) * 14;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="58" height="20" viewBox="0 0 58 20">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ── DATE RANGE FILTER (shared) ─────────────────────────────── */
const RangeFilter = ({
  value,
  onChange,
  from,
  to,
  onFromChange,
  onToChange,
}) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {RANGE_OPTIONS.map((opt) => {
      const active = value === opt.key;
      return (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={
            active
              ? { background: "#0085D4", color: "#FFFFFF" }
              : { background: "#F1F5F9", color: "#64748B" }
          }
        >
          {opt.label}
        </button>
      );
    })}
    {value === "custom" && (
      <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600"
        />
        <span className="text-xs text-gray-400">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600"
        />
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   1. KPI STRIP
══════════════════════════════════════════════════════════════ */
const KpiStrip = () => (
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
    <Card className="p-5" style={{ borderLeft: "3px solid #0085D4" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Detections today
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#EFF8FF", color: "#0085D4" }}
        >
          ↑ 18%
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">312</p>
      <div className="flex items-center justify-between mt-3">
        <Sparkline data={SPARK} color="#0085D4" />
        <span className="text-xs text-gray-400">7-day trend</span>
      </div>
    </Card>

    <Card className="p-5" style={{ borderLeft: "3px solid #22C55E" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Active cameras
        </p>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-0.5" />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">22</span>
        <span className="text-lg text-gray-400 font-medium">/ 24</span>
      </div>
      <div className="flex gap-2 mt-3">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "#DCFCE7", color: "#166534" }}
        >
          ● 22 online
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
        >
          ● 2 offline
        </span>
      </div>
    </Card>

    <Card className="p-5" style={{ borderLeft: "3px solid #F59E0B" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          PPE compliance
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#FEF3C7", color: "#92400E" }}
        >
          ↓ 3%
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">87%</p>
      <div className="mt-3">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: "87%", background: "#F59E0B" }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Target 95%</p>
      </div>
    </Card>

    <Card className="p-5" style={{ borderLeft: "3px solid #8B5CF6" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Avg response
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#DCFCE7", color: "#166534" }}
        >
          ↓ 0.8m
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">3.2</span>
        <span className="text-base text-gray-400 font-medium">min</span>
      </div>
      <p className="text-xs font-semibold mt-3" style={{ color: "#22C55E" }}>
        ↓ 0.8 min better than yesterday
      </p>
    </Card>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   2. DETECTION ACTIVITY — animated · filterable · hover tooltip
══════════════════════════════════════════════════════════════ */
const ActivityChart = () => {
  const [range, setRange] = useState("yesterday");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hoverIdx, setHover] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // Batched: flip data + replay entrance animation in one render
  const handleRangeChange = (newRange) => {
    setRange(newRange);
    setAnimKey((k) => k + 1);
    setHover(null);
  };

  const cfg = RANGES[range];
  const data = cfg.data;
  const maxN = Math.max(...data.map((d) => d.n));
  const BW = range === "yesterday" ? 24 : range === "last7" ? 70 : 16;
  const GAP = range === "yesterday" ? 6 : range === "last7" ? 14 : 4;
  const TW = data.length * (BW + GAP);
  const H = 80;

  return (
    <Card className="p-5">
      {/* keyframes — unique name avoids collisions */}
      <style>{`
        @keyframes dashboardGrowBar {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Detection activity
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {cfg.label} · {data.reduce((s, d) => s + d.n, 0)} total events
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(TC).map(([k, v]) => (
            <span
              key={k}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: v.bar }}
              />
              {v.name}
            </span>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <RangeFilter
        value={range}
        onChange={handleRangeChange}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      {/* Chart + tooltip */}
      <div className="relative mt-4">
        <svg
          key={animKey}
          viewBox={`0 0 ${TW} ${H}`}
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: 120 }}
        >
          {data.map((d, i) => {
            const bh = Math.max((d.n / maxN) * (H - 8), 4);
            const x = i * (BW + GAP);
            const y = H - bh;
            const color = TC[d.t]?.bar || "#94A3B8";
            const isHover = hoverIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                {/* full-height invisible hit area — easier to hover short bars */}
                <rect x={x} y={0} width={BW} height={H} fill="transparent" />
                <rect
                  x={x}
                  y={y}
                  width={BW}
                  height={bh}
                  rx="3"
                  fill={color}
                  opacity={hoverIdx === null ? 1 : isHover ? 1 : 0.38}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom",
                    animation: `dashboardGrowBar 0.5s cubic-bezier(.34,1.56,.64,1) ${i * 18}ms both`,
                    transition: "opacity 0.15s ease",
                  }}
                />
                {isHover && (
                  <rect
                    x={x - 1.5}
                    y={y - 1.5}
                    width={BW + 3}
                    height={bh + 3}
                    rx="4"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {cfg.axisLabels.map((l, i) => (
          <span key={i} className="text-xs text-gray-400">
            {l}
          </span>
        ))}
      </div>
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════════
   3. RECENT ALERTS
══════════════════════════════════════════════════════════════ */
const AlertsFeed = ({ onNavigate }) => (
  <Card className="flex flex-col overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
      <p className="text-sm font-semibold text-gray-800">Recent alerts</p>
      <button
        onClick={() => onNavigate("events")}
        className="text-xs font-semibold transition-opacity hover:opacity-70"
        style={{ color: "#0085D4" }}
      >
        View all →
      </button>
    </div>
    <div className="flex-1 divide-y divide-gray-50">
      {ALERTS.map((a) => {
        const tc = TC[a.type];
        return (
          <div
            key={a.id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0"
              style={{ background: tc.bg, color: tc.text }}
            >
              {tc.name}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {a.cam}
              </p>
              <p className="text-xs text-gray-400 truncate">{a.zone}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">{a.time}</p>
              {!a.acked && (
                <p className="text-xs font-bold" style={{ color: "#EF4444" }}>
                  Unacked
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

/* ══════════════════════════════════════════════════════════════
   4. ZONE ACTIVITY — filterable
══════════════════════════════════════════════════════════════ */
const ZoneActivity = () => {
  const [range, setRange] = useState("yesterday");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const zones = ZONES_BY_RANGE[range];
  const maxE = Math.max(...zones.map((z) => z.events));

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-2.5 px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Zone activity</p>
          <span className="text-xs text-gray-400">{RANGES[range].label}</span>
        </div>
        <RangeFilter
          value={range}
          onChange={setRange}
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />
      </div>
      <div className="flex-1 flex flex-col justify-around px-5 py-4 gap-3.5">
        {zones.map((z) => (
          <div key={z.name} className="flex items-center gap-3">
            <p
              className="text-xs font-medium text-gray-600 flex-shrink-0"
              style={{ width: 96 }}
            >
              {z.name}
            </p>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(z.events / maxE) * 100}%`,
                  background: z.color,
                }}
              />
            </div>
            <span
              className="text-xs font-bold text-gray-700 flex-shrink-0"
              style={{ minWidth: 36, textAlign: "right" }}
            >
              {z.events}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════════
   5. CAMERA HEALTH — full width
══════════════════════════════════════════════════════════════ */
const CameraGrid = () => {
  const onlineCount = CAMERAS.filter((c) => c.online).length;
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-800">Camera health</p>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>
            ● {onlineCount} online
          </span>
          <span className="text-xs font-semibold" style={{ color: "#EF4444" }}>
            ● {CAMERAS.length - onlineCount} offline
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {CAMERAS.map((cam) => (
          <div
            key={cam.id}
            className="rounded-xl p-2.5 flex flex-col gap-0.5"
            style={{
              background: cam.online ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${cam.online ? "#BBF7D0" : "#FECACA"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-bold"
                style={{
                  color: cam.online ? "#166534" : "#991B1B",
                  fontSize: 11,
                }}
              >
                {cam.id}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: cam.online ? "#22C55E" : "#EF4444" }}
              />
            </div>
            <p className="truncate text-gray-500" style={{ fontSize: 10 }}>
              {cam.zone}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════════ */
export default function DashboardPage({
  isCollapsed = false,
  onNavigate = () => {},
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300 left-0 md:left-[80px] ${
        isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"
      }`}
      style={{ background: "#F4F6F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-6 px-4 sm:px-6 pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "#0F345E" }}
              >
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {now.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                ·{" "}
                {now.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                All systems online
              </span>
              <button
                className="px-4 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90 active:scale-95 transition-all"
                style={{ background: "#0085D4" }}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* 1 · KPI Strip */}
          <KpiStrip />

          {/* 2 · Detection Activity */}
          <ActivityChart />

          {/* 3 + 4 · Alerts + Zone Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertsFeed onNavigate={onNavigate} />
            <ZoneActivity />
          </div>

          {/* 5 · Camera Health (full width) */}
          <CameraGrid />
        </div>
      </div>

      <Footer />
    </div>
  );
}
