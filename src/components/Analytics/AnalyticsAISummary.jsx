// src/components/Analytics/AnalyticsAISummary.jsx

import React from "react";

const AnalyticsAISummary = ({ data, loading }) => {
  // Expected data shape: { insights: string[] } (array of text insights)
  const ai = data || null;

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl shadow-sm p-4 animate-pulse"
        style={{ border: "1px solid #0085D44D" }}
      >
        <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-5/6 bg-gray-200 rounded" />
          <div className="h-3 w-4/6 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!ai || !ai.insights || ai.insights.length === 0) {
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
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
        <p className="text-sm">No AI insights yet</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4"
      style={{ border: "1px solid #0085D44D" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-purple-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-gray-700">AI Insights</h3>
      </div>
      <ul className="space-y-2">
        {ai.insights.map((insight, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-xs text-gray-600"
          >
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnalyticsAISummary;
