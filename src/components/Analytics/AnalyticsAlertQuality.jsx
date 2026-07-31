// src/components/Analytics/AnalyticsAlertQuality.jsx

import React from "react";

const AnalyticsAlertQuality = ({ data, loading }) => {
  // Expected data shape: { total: number, true_alerts: number, false_alerts: number, precision: number }
  const metrics = data || null;

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!metrics) {
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">No alert quality data available</p>
      </div>
    );
  }

  const total = metrics.total || 0;
  const trueAlerts = metrics.true_alerts || 0;
  const falseAlerts = metrics.false_alerts || 0;
  const precision =
    metrics.precision ??
    (total > 0 ? ((trueAlerts / total) * 100).toFixed(1) : 0);
  const truePercent = total > 0 ? (trueAlerts / total) * 100 : 0;
  const falsePercent = total > 0 ? (falseAlerts / total) * 100 : 0;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Alert Quality
      </h3>

      {/* Stacked horizontal bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Total Alerts</span>
          <span className="text-gray-700 font-semibold">{total}</span>
        </div>
        <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${truePercent}%` }}
          />
          <div
            className="h-full bg-red-400 transition-all"
            style={{ width: `${falsePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1 text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            True ({trueAlerts})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            False ({falseAlerts})
          </span>
        </div>
      </div>

      {/* Precision indicator */}
      <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
        <span className="text-xs text-blue-600 font-medium">Precision</span>
        <span className="text-lg font-bold text-blue-600">{precision}%</span>
      </div>
    </div>
  );
};

export default AnalyticsAlertQuality;
