// src/components/Analytics/AnalyticsCameraHealth.jsx

import React from "react";

const AnalyticsCameraHealth = ({ data, loading }) => {
  // Expected data shape: { total: number, online: number, offline: number, cameras?: array }
  const health = data || null;

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!health) {
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
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">No camera health data</p>
      </div>
    );
  }

  const total = health.total || 0;
  const online = health.online || 0;
  const offline = health.offline || total - online;
  const onlinePercent = total > 0 ? Math.round((online / total) * 100) : 0;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Camera Health
      </h3>

      {/* Gauge circle */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* background circle */}
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="3"
            />
            {/* online arc */}
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray={`${onlinePercent} ${100 - onlinePercent}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-800">
              {onlinePercent}%
            </span>
            <span className="text-[10px] text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-gray-600">Online ({online})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span className="text-gray-600">Offline ({offline})</span>
        </div>
      </div>

      {/* Camera list (if provided) */}
      {health.cameras && health.cameras.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
          {health.cameras.map((cam, idx) => (
            <div
              key={cam.id || idx}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${cam.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                />
                <span className="text-gray-700 truncate">{cam.name}</span>
              </div>
              <span className="text-gray-500">{cam.lastSeen || "—"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-gray-400 mt-3">
        {total} cameras total
      </div>
    </div>
  );
};

export default AnalyticsCameraHealth;
