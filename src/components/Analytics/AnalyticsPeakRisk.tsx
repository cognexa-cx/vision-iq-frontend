// src/components/Analytics/AnalyticsPeakRisk.jsx

import React from "react";

const AnalyticsPeakRisk = ({ data, loading }) => {
  // Sample data shape: { peak_hour: "10Am-11Am", high_risk_zones: ["Zone A", "Zone B"], total_alerts: 142 }
  const peak = data || null;

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!peak) {
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
        <p className="text-sm">No peak risk data available</p>
      </div>
    );
  }

  const riskZones = peak.high_risk_zones || [];
  const peakHour = peak.peak_hour || "—";
  const totalAlerts = peak.total_alerts || 0;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Peak Risk Analysis
      </h3>

      {/* Peak hour display */}
      <div className="bg-red-50 rounded-xl p-3 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-red-500"
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
        </div>
        <div>
          <p className="text-xs text-red-400 font-medium">Peak Hour</p>
          <p className="text-sm font-semibold text-red-600">{peakHour}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-red-400">Total Alerts</p>
          <p className="text-lg font-bold text-red-600">{totalAlerts}</p>
        </div>
      </div>

      {/* High-risk zones */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          High‑Risk Zones
        </p>
        {riskZones.length > 0 ? (
          riskZones.map((zone, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm text-gray-700">{zone}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No high‑risk zones detected</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPeakRisk;
