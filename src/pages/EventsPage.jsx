// src/pages/EventsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Footer from "../components/Common/Footer";
import { getEvents, getEventSnapshotUrl } from "../api/events";

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const ITEMS_PER_PAGE = 20;

const SEVERITY_META = {
  critical: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    hex: "#EF4444",
  },
  high: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    hex: "#F97316",
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
    hex: "#EAB308",
  },
  low: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    hex: "#3B82F6",
  },
};

const TYPE_META = {
  fall: { bg: "bg-purple-100", text: "text-purple-700", hex: "#9333EA" },
  animal: { bg: "bg-green-100", text: "text-green-700", hex: "#16A34A" },
  intrusion: { bg: "bg-red-100", text: "text-red-700", hex: "#DC2626" },
  vehicle: { bg: "bg-blue-100", text: "text-blue-700", hex: "#2563EB" },
};

const DATE_TABS = [
  { label: "Today", value: "today" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "Custom", value: "custom" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const cls_severity = (s) => {
  const m = SEVERITY_META[s];
  return m
    ? `px-2 py-0.5 rounded-full text-xs font-medium border ${m.bg} ${m.text} ${m.border}`
    : "px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200";
};

const cls_type = (t) => {
  const m = TYPE_META[t];
  return m
    ? `px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`
    : "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600";
};

const buildDateParams = (range, start, end) => {
  const now = Date.now();
  if (range === "today") {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    return { start: s.toISOString() };
  }
  if (range === "7d")
    return { start: new Date(now - 7 * 86_400_000).toISOString() };
  if (range === "30d")
    return { start: new Date(now - 30 * 86_400_000).toISOString() };
  if (range === "custom" && start) {
    const p = { start: new Date(start).toISOString() };
    if (end) p.end = new Date(end + "T23:59:59").toISOString();
    return p;
  }
  return {};
};

const exportCSV = (rows) => {
  const header = [
    "Event ID",
    "Camera",
    "Type",
    "Severity",
    "Message",
    "Timestamp",
  ];
  const body = rows.map((e) => [
    e.id,
    e.camera_name,
    e.event_type,
    e.severity,
    `"${(e.message || "").replace(/"/g, '""')}"`,
    new Date(e.created_at).toISOString(),
  ]);
  const csv = [header, ...body].map((r) => r.join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    ),
    download: `events-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ─── SummaryBar — 6 stat cards ────────────────────────────────────────────────
function SummaryBar({ events }) {
  const total = events.length;
  const critical = events.filter((e) => e.severity === "critical").length;
  const high = events.filter((e) => e.severity === "high").length;
  const cameras = new Set(events.map((e) => e.camera_name).filter(Boolean))
    .size;
  const lastHour = events.filter(
    (e) => new Date(e.created_at) > new Date(Date.now() - 3_600_000),
  ).length;

  const byCamera = {};
  events.forEach((e) => {
    if (e.camera_name)
      byCamera[e.camera_name] = (byCamera[e.camera_name] || 0) + 1;
  });
  const [topCam, topCount] = Object.entries(byCamera).sort(
    (a, b) => b[1] - a[1],
  )[0] ?? ["—", 0];

  const stats = [
    {
      label: "Total Events",
      value: total,
      accent: "#3B82F6",
      iconBg: "#EFF6FF",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#3B82F6"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: "Critical",
      value: critical,
      accent: "#EF4444",
      iconBg: "#FEF2F2",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#EF4444"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    {
      label: "High Severity",
      value: high,
      accent: "#F97316",
      iconBg: "#FFF7ED",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#F97316"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Cameras Active",
      value: cameras,
      accent: "#10B981",
      iconBg: "#ECFDF5",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#10B981"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "Last Hour",
      value: lastHour,
      accent: "#6366F1",
      iconBg: "#EEF2FF",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#6366F1"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Most Active",
      value: topCam,
      sub: topCount > 0 ? `${topCount} events` : "",
      accent: "#8B5CF6",
      iconBg: "#F5F3FF",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#8B5CF6"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: s.accent }}
          />
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: s.iconBg }}
          >
            {s.icon}
          </div>
          <p
            className={`font-bold text-gray-900 leading-none mb-1 ${typeof s.value === "string" && s.value.length > 8 ? "text-sm" : "text-2xl"}`}
          >
            {s.value}
          </p>
          <p className="text-xs text-gray-400 font-medium leading-tight">
            {s.label}
          </p>
          {s.sub && (
            <p
              className="text-xs mt-1 font-semibold"
              style={{ color: s.accent }}
            >
              {s.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({
  dateRange,
  setDateRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  typeFilter,
  setTypeFilter,
  severityFilter,
  setSeverityFilter,
  cameraFilter,
  setCameraFilter,
  sortOrder,
  setSortOrder,
  searchFilter,
  setSearchFilter,
  cameraOptions,
  onRefresh,
  refreshing,
  onExport,
}) {
  const TYPES = ["all", "fall", "animal", "intrusion", "vehicle"];
  const SEVS = ["all", "critical", "high", "medium", "low"];

  const selectCls =
    "text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-shrink-0";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date range */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className={selectCls}
        >
          {DATE_TABS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {/* Custom date pickers */}
        {dateRange === "custom" && (
          <>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-shrink-0"
            />
            <span className="text-xs text-gray-400 flex-shrink-0">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex-shrink-0"
            />
          </>
        )}

        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

        {/* Type */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectCls}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All Types" : t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>

        {/* Camera */}
        <select
          value={cameraFilter}
          onChange={(e) => setCameraFilter(e.target.value)}
          className={`${selectCls} max-w-[160px]`}
        >
          <option value="">All Cameras</option>
          {cameraOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className={selectCls}
        >
          {SEVS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Severities" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className={selectCls}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="severity">Severity ↓</option>
        </select>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative flex-shrink-0">
          <svg
            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search events…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-40 transition-colors"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <svg
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>

        {/* Live */}
        <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live
        </span>

        {/* Export CSV */}
        <button
          onClick={onExport}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}

// ─── Active Filter Chips + result count ──────────────────────────────────────
function ActiveFilters({
  typeFilter,
  setTypeFilter,
  severityFilter,
  setSeverityFilter,
  cameraFilter,
  setCameraFilter,
  dateRange,
  setDateRange,
  searchFilter,
  setSearchFilter,
  filteredCount,
  totalCount,
}) {
  const chips = [
    typeFilter !== "all" && {
      label: `Type: ${typeFilter}`,
      clear: () => setTypeFilter("all"),
    },
    severityFilter !== "all" && {
      label: `Severity: ${severityFilter}`,
      clear: () => setSeverityFilter("all"),
    },
    cameraFilter && {
      label: `Camera: ${cameraFilter}`,
      clear: () => setCameraFilter(""),
    },
    dateRange !== "7d" && {
      label: `Date: ${dateRange}`,
      clear: () => setDateRange("7d"),
    },
    searchFilter && {
      label: `"${searchFilter}"`,
      clear: () => setSearchFilter(""),
    },
  ].filter(Boolean);

  const clearAll = () => {
    setTypeFilter("all");
    setSeverityFilter("all");
    setCameraFilter("");
    setDateRange("7d");
    setSearchFilter("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[28px]">
      <span className="text-xs text-gray-400">
        Showing{" "}
        <strong className="text-gray-700 font-semibold">{filteredCount}</strong>
        {filteredCount !== totalCount && (
          <>
            {" "}
            of{" "}
            <strong className="text-gray-700 font-semibold">
              {totalCount}
            </strong>
          </>
        )}{" "}
        events
      </span>

      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
        >
          {chip.label}
          <button
            onClick={chip.clear}
            className="hover:text-blue-900 transition-colors ml-0.5"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const range = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      range.push(i);
    }
  }
  const withEllipsis = [];
  let prev = null;
  for (const p of range) {
    if (prev !== null && p - prev > 1) withEllipsis.push("…");
    withEllipsis.push(p);
    prev = p;
  }

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        Showing{" "}
        <span className="font-semibold text-gray-600">
          {startItem}–{endItem}
        </span>{" "}
        of <span className="font-semibold text-gray-600">{totalItems}</span>{" "}
        events
      </span>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Prev
        </button>

        {/* Page numbers */}
        {withEllipsis.map((p, i) =>
          p === "…" ? (
            <span
              key={`e-${i}`}
              className="px-1 text-xs text-gray-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 text-xs font-medium rounded-lg transition ${
                p === currentPage
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <img
          src={src}
          alt="Event snapshot"
          className="w-full h-auto max-h-[85vh] object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            const ph = e.target.parentElement.querySelector(".err-ph");
            if (ph) ph.style.display = "flex";
          }}
        />
        <div className="err-ph hidden absolute inset-0 flex-col items-center justify-center bg-gray-100 text-gray-500">
          <span className="text-4xl mb-2">🖼️</span>
          <p className="text-sm">Snapshot could not be loaded</p>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton({ layout }) {
  return (
    <div className={layout} style={{ background: "#F4F6F8" }}>
      <div className="flex-1 overflow-y-auto pt-6 px-4 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-36" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl" />
              ))}
          </div>
          <div className="h-14 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="space-y-3">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-11 bg-gray-200 rounded" />
              ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventsPage({ isCollapsed = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [cameraFilter, setCameraFilter] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // ── Pagination state ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    typeFilter,
    severityFilter,
    cameraFilter,
    searchFilter,
    sortOrder,
    dateRange,
    customStart,
    customEnd,
  ]);

  // ── Server-side API params ──────────────────────────────────────────────────
  const apiParams = useMemo(
    () => ({
      limit: 1000,
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      ...buildDateParams(dateRange, customStart, customEnd),
    }),
    [typeFilter, dateRange, customStart, customEnd],
  );

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getEvents(apiParams);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiParams]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    const id = setInterval(fetchEvents, 30_000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  // ── Camera options ──────────────────────────────────────────────────────────
  const cameraOptions = useMemo(
    () => [...new Set(events.map((e) => e.camera_name).filter(Boolean))].sort(),
    [events],
  );

  // ── Client-side filtering + sorting ────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = events;
    if (cameraFilter)
      result = result.filter((e) => e.camera_name === cameraFilter);
    if (severityFilter !== "all")
      result = result.filter((e) => e.severity === severityFilter);
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (e) =>
          e.camera_name?.toLowerCase().includes(q) ||
          e.event_type?.toLowerCase().includes(q) ||
          e.message?.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      if (sortOrder === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === "severity")
        return (
          (SEVERITY_ORDER[a.severity] ?? 99) -
          (SEVERITY_ORDER[b.severity] ?? 99)
        );
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [events, cameraFilter, severityFilter, searchFilter, sortOrder]);

  // ── Pagination derived values ───────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / ITEMS_PER_PAGE),
  );
  const paginatedEvents = useMemo(
    () =>
      filteredEvents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredEvents, currentPage],
  );

  // ── Layout ──────────────────────────────────────────────────────────────────
  const layout = `fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300 left-0 md:left-[80px] ${isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"}`;

  // ── States ───────────────────────────────────────────────────────────────────
  if (loading && events.length === 0)
    return <LoadingSkeleton layout={layout} />;

  if (error) {
    return (
      <div className={layout} style={{ background: "#F4F6F8" }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl">⚠️</span>
            <p className="text-lg font-semibold text-red-500 mt-4">
              Failed to load events
            </p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className={layout} style={{ background: "#F4F6F8" }}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="pt-6 px-4 sm:px-6">
            {/* Page title */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Events
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                Real-time event log & Monitoring
              </p>
            </div>

            {/* Stat cards */}
            <SummaryBar events={filteredEvents} />

            {/* Filters */}
            <FilterBar
              dateRange={dateRange}
              setDateRange={setDateRange}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
              cameraFilter={cameraFilter}
              setCameraFilter={setCameraFilter}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              cameraOptions={cameraOptions}
              onRefresh={() => {
                setRefreshing(true);
                fetchEvents();
              }}
              refreshing={refreshing}
              onExport={() => exportCSV(filteredEvents)}
            />

            {/* Active filter chips */}
            <ActiveFilters
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
              cameraFilter={cameraFilter}
              setCameraFilter={setCameraFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              filteredCount={filteredEvents.length}
              totalCount={events.length}
            />

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        "Event ID",
                        "Camera",
                        "Type",
                        "Severity",
                        "Message",
                        "Timestamp",
                        "Snapshot",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedEvents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-16 text-center text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-4xl">📋</span>
                            <p className="text-sm font-medium">
                              No events match your filters
                            </p>
                            <p className="text-xs">
                              Try adjusting the date range, type, or severity
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedEvents.map((event, idx) => (
                        <tr
                          key={event.id + idx}
                          className="hover:bg-blue-50/20 transition-colors"
                        >
                          <td className="px-5 py-3 text-xs font-mono text-gray-400">
                            {event.id.slice(0, 8)}…
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                            {event.camera_name}
                          </td>
                          <td className="px-5 py-3">
                            <span className={cls_type(event.event_type)}>
                              {event.event_type}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={cls_severity(event.severity)}>
                              {event.severity}
                            </span>
                          </td>
                          <td
                            className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate"
                            title={event.message}
                          >
                            {event.message}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(event.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            {event.snapshot_path ? (
                              <>
                                <img
                                  src={getEventSnapshotUrl(event.id)}
                                  alt="snapshot"
                                  className="w-12 h-9 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition"
                                  onClick={() =>
                                    setSelectedSnapshot(
                                      getEventSnapshotUrl(event.id),
                                    )
                                  }
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display =
                                      "inline";
                                  }}
                                />
                                <span className="text-xs text-gray-400 hidden">
                                  —
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEvents.length}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <Lightbox
        src={selectedSnapshot}
        onClose={() => setSelectedSnapshot(null)}
      />
    </>
  );
}
