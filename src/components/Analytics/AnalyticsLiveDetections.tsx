// src/components/Analytics/AnalyticsLiveDetections.jsx
import React from "react";

const AnalyticsLiveDetections = ({ data, loading }) => {
  const detections = data || [];

  if (loading) {
    return (
      <div className="bg-white p-5 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 flex flex-col h-full border-none">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">
          Live Streams
        </h3>
        <span className="flex items-center gap-2 px-2.5 py-1 text-[11px] font-bold text-green-700 bg-green-50 rounded-full border border-green-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          LIVE FEED
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {detections.map((item, idx) => (
          <div
            key={item.type || idx}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors duration-200 group border border-transparent hover:border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: (item.color || "#0085D4") + "12",
                  color: item.color || "#0085D4",
                }}
              >
                {(item.type || "D").substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {item.type}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 font-mono">
                {item.count.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsLiveDetections;
