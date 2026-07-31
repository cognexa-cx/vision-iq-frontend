// src/components/Analytics/AnalyticsConfidenceChart.jsx

import React from "react";

const AnalyticsConfidenceChart = ({ data, loading }) => {
  // Expected data shape: array of { label: string, confidence: number (0-100) }
  const items = data || [];

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="flex-1 h-2 bg-gray-200 rounded" />
            <div className="h-3 w-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-sm">No confidence data available</p>
      </div>
    );
  }

  // Determine color based on confidence level
  const getBarColor = (val) => {
    if (val >= 90) return "bg-green-500";
    if (val >= 70) return "bg-blue-500";
    if (val >= 50) return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Model Confidence
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => {
          const pct = Math.min(100, Math.max(0, item.confidence || 0));
          return (
            <div key={item.label || idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">{item.label}</span>
                <span className="text-gray-500">{pct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsConfidenceChart;
