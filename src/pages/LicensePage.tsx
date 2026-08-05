// src/pages/LicensePage.jsx
import React, { useState } from "react";
import Footer from "../components/Common/Footer";

// ─── Progress Bar Component ──────────────────────────────
const ProgressBar = ({ value, max, color = "#0085D4", label }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-800 font-medium">
            {value} / {max}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// ─── Feature Row Component ───────────────────────────────
const FeatureRow = ({ feature, enabled }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2">
      {enabled ? (
        <svg
          className="w-4 h-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-gray-300"
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
      )}
      <span className="text-sm text-gray-700">{feature}</span>
    </div>
    {enabled ? (
      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        Active
      </span>
    ) : (
      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
        Upgrade
      </span>
    )}
  </div>
);

// ─── Page Component ──────────────────────────────────────
export default function LicensePage({ isCollapsed = false }) {
  const [licenseKey, setLicenseKey] = useState("VQ-XXXX-XXXX-XXXX-XXXX");

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300
        left-0 md:left-[80px]
        ${isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"}
      `}
      style={{ background: "#F4F6F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col pt-6 px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                License
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your product license & usage
              </p>
            </div>
            <button className="mt-4 sm:mt-0 px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all">
              Renew License
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 pb-6">
            {/* Left: License Card */}
            <div className="xl:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 premium-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Enterprise Plan
                    </p>
                    <p className="text-xs text-gray-500">
                      Licensed to DAccess Security Systems Pvt. Ltd
                    </p>
                  </div>
                  <span className="mt-3 sm:mt-0 px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div>
                    <p className="text-xs text-gray-500">Issued</p>
                    <p className="text-sm font-semibold text-gray-800">
                      12 Jan 2026
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expires</p>
                    <p className="text-sm font-semibold text-gray-800">
                      11 Jan 2027
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Days Left</p>
                    <p className="text-sm font-semibold text-green-600">
                      223 days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seats</p>
                    <p className="text-sm font-semibold text-gray-800">10</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ProgressBar
                    value={8}
                    max={10}
                    color="#0085D4"
                    label="Cameras Used"
                  />
                  <ProgressBar
                    value={123.5}
                    max={500}
                    color="#6B4FF8"
                    label="Storage (GB)"
                  />
                  <ProgressBar
                    value={45}
                    max={100}
                    color="#F8C94F"
                    label="API Calls (K/day)"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 premium-card">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">
                  Included Features
                </h3>
                <div className="space-y-1">
                  <FeatureRow feature="Fall Detection" enabled={true} />
                  <FeatureRow feature="Animal Detection" enabled={true} />
                  <FeatureRow feature="Intrusion Zones" enabled={true} />
                  <FeatureRow feature="Vehicle Counting" enabled={true} />
                  <FeatureRow feature="Crowd Analysis" enabled={true} />
                  <FeatureRow feature="Heatmap Analytics" enabled={false} />
                  <FeatureRow feature="AI Insights (GPT)" enabled={false} />
                  <FeatureRow feature="Multi‑Site Support" enabled={false} />
                </div>
              </div>
            </div>

            {/* Right: License Key & Support */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 premium-card">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  License Key
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={licenseKey}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(licenseKey);
                    }}
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Use this key to activate additional installations.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 premium-card">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Support
                </h3>
                <ul className="space-y-3 text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    support@daccess.com
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    +91 12345 67890
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Visit our Knowledge Base
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
