// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import Footer from "../components/Common/Footer";

// ─── Toggle Switch Component ──────────────────────────────
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
      enabled ? "bg-blue-500" : "bg-gray-300"
    }`}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

// ─── Section Wrapper Component ────────────────────────────
const Section = ({ title, description, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 premium-card">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// ─── Page Component ───────────────────────────────────────
export default function SettingsPage({ isCollapsed = false }) {
  // Dummy states for interactive toggles/fields
  const [autoStart, setAutoStart] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataRetention, setDataRetention] = useState("30");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
                Settings
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage system preferences & configurations
              </p>
            </div>
            <button
              onClick={handleSave}
              className="mt-4 sm:mt-0 px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              {saved ? (
                <>
                  <svg
                    className="w-4 h-4"
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
                  Saved
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 pb-6">
            {/* Left Column */}
            <div className="space-y-5">
              <Section title="System" description="Core application settings">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Start with system
                    </p>
                    <p className="text-xs text-gray-500">
                      Launch automatically on boot
                    </p>
                  </div>
                  <Toggle
                    enabled={autoStart}
                    onChange={() => setAutoStart(!autoStart)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Dark mode
                    </p>
                    <p className="text-xs text-gray-500">
                      Switch to dark color theme
                    </p>
                  </div>
                  <Toggle
                    enabled={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Data retention (days)
                  </p>
                  <select
                    value={dataRetention}
                    onChange={(e) => setDataRetention(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="7">7 days</option>
                    <option value="15">15 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </Section>

              <Section
                title="Notifications"
                description="Alert & notification preferences"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Push notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Receive instant alerts
                    </p>
                  </div>
                  <Toggle
                    enabled={notifications}
                    onChange={() => setNotifications(!notifications)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Sound alerts
                    </p>
                    <p className="text-xs text-gray-500">
                      Play alert sounds on events
                    </p>
                  </div>
                  <Toggle
                    enabled={soundAlerts}
                    onChange={() => setSoundAlerts(!soundAlerts)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Email alerts
                    </p>
                    <p className="text-xs text-gray-500">Send summary emails</p>
                  </div>
                  <Toggle
                    enabled={emailAlerts}
                    onChange={() => setEmailAlerts(!emailAlerts)}
                  />
                </div>
              </Section>

              <Section
                title="Camera Defaults"
                description="Default settings for new cameras"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Resolution
                    </p>
                    <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option>1080p (Full HD)</option>
                      <option>720p (HD)</option>
                      <option>4K (Ultra HD)</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      FPS
                    </p>
                    <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option>30</option>
                      <option>25</option>
                      <option>15</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Bitrate
                    </p>
                    <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option>2048 kbps</option>
                      <option>1024 kbps</option>
                      <option>4096 kbps</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Codec
                    </p>
                    <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option>H.264</option>
                      <option>H.265</option>
                      <option>MJPEG</option>
                    </select>
                  </div>
                </div>
              </Section>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <Section
                title="User Profile"
                description="Update your account details"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Full name
                    </p>
                    <input
                      type="text"
                      defaultValue="Admin User"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Email address
                    </p>
                    <input
                      type="email"
                      defaultValue="admin@daccess.com"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Timezone
                    </p>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option>Asia/Kolkata</option>
                      <option>Asia/Dubai</option>
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                    </select>
                  </div>
                </div>
              </Section>

              <Section
                title="API & Integrations"
                description="Manage API keys & webhooks"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">
                        API Key
                      </p>
                      <p className="text-xs text-gray-500 truncate font-mono">
                        sk-••••••••••••••••••••••••••••
                      </p>
                    </div>
                    <button className="ml-3 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                      Copy
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Webhook URL
                    </p>
                    <input
                      type="text"
                      defaultValue="https://hooks.daccess.com/events"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                  <button className="w-full px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition">
                    Regenerate API Key
                  </button>
                </div>
              </Section>

              <Section title="Danger Zone" description="Irreversible actions">
                <div className="space-y-3">
                  <button className="w-full px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition">
                    Reset all configurations
                  </button>
                  <button className="w-full px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition">
                    Delete all event data
                  </button>
                  <button className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-red-500 border border-red-500 rounded-xl hover:bg-red-600 transition">
                    Deactivate System
                  </button>
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
