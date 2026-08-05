// src/components/Analytics/AnalyticsCameraIncidents.jsx

import React from "react";
import { useAnalyticsSummary } from "../../hooks/useAnalytics";

const AnalyticsCameraIncidents = ({ data, loading }) => {
  const incidents = data || [];

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
              <div className="h-2 w-full bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!incidents.length) {
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
            d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">No incidents recorded</p>
      </div>
    );
  }

  const maxCount = Math.max(...incidents.map((i) => i.count), 1);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Camera Incidents
      </h3>
      <div className="space-y-3">
        {incidents.map((cam, idx) => (
          <div key={cam.camera_id || idx} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600">
              {cam.camera_name?.[0] || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-700 font-medium truncate">
                  {cam.camera_name || `Camera ${idx + 1}`}
                </span>
                <span className="text-gray-500 ml-2">{cam.count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(cam.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsCameraIncidents;
