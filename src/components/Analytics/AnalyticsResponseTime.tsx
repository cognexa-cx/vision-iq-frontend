// src/components/Analytics/AnalyticsResponseTime.jsx

import React from "react";

const AnalyticsResponseTime = ({ data, loading }) => {
  // Expected data shape: array of { label: string, time: number } (seconds)
  const times = data || [];

  // Color scale based on response time thresholds
  const getBarColor = (seconds) => {
    if (seconds <= 5) return "bg-green-500";
    if (seconds <= 10) return "bg-amber-400";
    return "bg-red-400";
  };

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="flex-1 h-2 bg-gray-200 rounded" />
            <div className="h-3 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!times.length) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center text-gray-400"
        style={{ border: "1px solid #0085D44D", minHeight: "200px" }}
      >
        <svg
          className="w-8 h-8 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">No response time data</p>
      </div>
    );
  }

  const maxTime = Math.max(...times.map((t) => t.time), 1);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Response Time
      </h3>
      <div className="space-y-3">
        {times.map((item, idx) => {
          const pct = (item.time / maxTime) * 100;
          return (
            <div key={item.label || idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">{item.label}</span>
                <span className="text-gray-500">{item.time}s</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(item.time)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> &lt;5s
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> 5‑10s
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" /> &gt;10s
        </span>
      </div>
    </div>
  );
};

export default AnalyticsResponseTime;
      