// src/pages/AnalyticsPage.jsx
import React, { useMemo } from "react";
// import { useEventsAnalytics } from "../hooks/useEventsAnalytics";   ← comment out when backend is offline

import AnalyticsSummaryCards from "../components/Analytics/AnalyticsSummaryCards";
import AnalyticsDonutChart from "../components/Analytics/AnalyticsDonutChart";
import AnalyticsLineChart from "../components/Analytics/AnalyticsLineChart";
import AnalyticsFallFrequency from "../components/Analytics/AnalyticsFallFrequency";
import AnalyticsHeatmap from "../components/Analytics/AnalyticsHeatmap";
import AnalyticsCameraIncidents from "../components/Analytics/AnalyticsCameraIncidents";
import AnalyticsPeakRisk from "../components/Analytics/AnalyticsPeakRisk";
import AnalyticsConfidenceChart from "../components/Analytics/AnalyticsConfidenceChart";
import AnalyticsAlertQuality from "../components/Analytics/AnalyticsAlertQuality";
import AnalyticsAISummary from "../components/Analytics/AnalyticsAISummary";
import AnalyticsLiveDetections from "../components/Analytics/AnalyticsLiveDetections";
import AnalyticsResponseTime from "../components/Analytics/AnalyticsResponseTime";
import AnalyticsCameraHealth from "../components/Analytics/AnalyticsCameraHealth";
import Footer from "../components/Common/Footer";

const AnalyticsPage = ({ isCollapsed = false }) => {
  // ── DUMMY DATA (replace with useEventsAnalytics when backend is online) ──
  const dummyAnalytics = {
    summary: {
      cameraCount: 24,
      runningCount: 22,
      eventCount: 312,
      openAlertCount: 47,
      byType: {
        fall: 132,
        animal: 84,
        intrusion: 56,
        vehicle: 40,
      },
      byCamera: {
        "Front Gate": 56,
        "Warehouse B": 48,
        "Parking Lot": 32,
        Lobby: 28,
        "Server Room": 12,
      },
      vehicleTotals: { in: 120, out: 98, current: 22 },
    },
    fallTimeseries: [
      { date: "26 May", value: 18 },
      { date: "27 May", value: 22 },
      { date: "28 May", value: 19 },
      { date: "29 May", value: 24 },
      { date: "30 May", value: 30 },
      { date: "31 May", value: 12 },
      { date: "01 Jun", value: 7 },
    ],
    animalTimeseries: [
      { date: "26 May", value: 10 },
      { date: "27 May", value: 12 },
      { date: "28 May", value: 14 },
      { date: "29 May", value: 8 },
      { date: "30 May", value: 16 },
      { date: "31 May", value: 18 },
      { date: "01 Jun", value: 6 },
    ],
    fallFrequency: [
      { day: "Mon", falls: 5, alerts: 12, resolved: 7 },
      { day: "Tue", falls: 8, alerts: 18, resolved: 10 },
      { day: "Wed", falls: 6, alerts: 14, resolved: 8 },
      { day: "Thu", falls: 9, alerts: 20, resolved: 11 },
      { day: "Fri", falls: 4, alerts: 10, resolved: 6 },
      { day: "Sat", falls: 2, alerts: 5, resolved: 3 },
      { day: "Sun", falls: 0, alerts: 2, resolved: 2 },
    ],
    cameraIncidents: [
      { camera_id: "1", camera_name: "Front Gate", count: 56 },
      { camera_id: "2", camera_name: "Warehouse B", count: 48 },
      { camera_id: "3", camera_name: "Parking Lot", count: 32 },
      { camera_id: "4", camera_name: "Lobby", count: 28 },
      { camera_id: "5", camera_name: "Server Room", count: 12 },
    ],
    liveDetections: [
      { type: "Fall", count: 132, trend: 5, color: "#F84F4F" },
      { type: "Animal", count: 84, trend: -2, color: "#F8C94F" },
      { type: "Intrusion", count: 56, trend: 8, color: "#6B4FF8" },
      { type: "Vehicle", count: 40, trend: 0, color: "#4FAFF8" },
    ],
    cameraHealth: {
      total: 24,
      online: 22,
      offline: 2,
      cameras: [
        { id: 1, name: "Front Gate", status: "online", lastSeen: "2 min ago" },
        { id: 2, name: "Warehouse B", status: "online", lastSeen: "1 min ago" },
        {
          id: 3,
          name: "Parking Lot",
          status: "offline",
          lastSeen: "3 hours ago",
        },
        { id: 4, name: "Lobby", status: "online", lastSeen: "10 sec ago" },
      ],
    },
    alertQuality: {
      total: 312,
      true_alerts: 270,
      false_alerts: 42,
      precision: 86.5,
    },
    peakRisk: {
      peak_hour: "10AM – 11AM",
      total_alerts: 142,
      high_risk_zones: ["Loading Dock", "Server Room", "Reception"],
    },
    modelConfidence: [
      { label: "Fall Detection", confidence: 94.2 },
      { label: "Animal Detection", confidence: 88.5 },
      { label: "Intrusion Detection", confidence: 76.3 },
    ],
    aiInsights: {
      insights: [
        "Fall alerts increased by 15% compared to last week.",
        "Animal detections peak between 6AM and 8AM.",
        "False alert rate dropped by 5% after latest model update.",
      ],
    },
  };

  // Use dummy data directly (no loading, no errors)
  const loading = false;
  const {
    summary,
    fallTimeseries,
    animalTimeseries,
    fallFrequency,
    cameraIncidents,
    liveDetections,
    cameraHealth,
    alertQuality,
    peakRisk,
    modelConfidence,
    aiInsights,
  } = dummyAnalytics;

  // Ensure live detections have colors (already set above, but just in case)
  const liveDetectionsWithColor = useMemo(
    () => liveDetections.map((d) => ({ ...d, color: d.color || "#0085D4" })),
    [liveDetections],
  );

  return (
    <div
      className={`fixed font-poppins top-[80px] right-0 bottom-0 flex flex-col transition-all duration-300 left-0 md:left-[80px] ${
        isCollapsed ? "lg:left-[80px]" : "lg:left-[280px]"
      }`}
      style={{ background: "#F4F6F8" }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col pt-6 px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Real‑time insights & operational metrics
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                Last 7 days
              </button>
              <button
                className="px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
                style={{ background: "#0085D4" }}
              >
                Export Summary
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="mb-6">
            <AnalyticsSummaryCards data={summary} loading={loading} />
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 flex-1 pb-6">
            {[
              <AnalyticsLineChart
                title="Fall Events"
                data={fallTimeseries}
                color="#F84F4F"
                gradientId="fallGrad"
                gradientStart="#F84F4F"
                gradientEnd="#F84F4F05"
              />,
              <AnalyticsLineChart
                title="Animal Events"
                data={animalTimeseries}
                color="#F8C94F"
                gradientId="animalGrad"
                gradientStart="#F8C94F"
                gradientEnd="#F8C94F05"
              />,
              <AnalyticsDonutChart />,
              <AnalyticsFallFrequency data={fallFrequency} loading={loading} />,
              <AnalyticsHeatmap data={[]} loading={false} />,
              <AnalyticsCameraIncidents
                data={cameraIncidents}
                loading={loading}
              />,
              <AnalyticsPeakRisk data={peakRisk} loading={loading} />,
              <AnalyticsConfidenceChart
                data={modelConfidence}
                loading={loading}
              />,
              <AnalyticsAlertQuality data={alertQuality} loading={loading} />,
              <AnalyticsAISummary data={aiInsights} loading={loading} />,
              <AnalyticsLiveDetections
                data={liveDetectionsWithColor}
                loading={loading}
              />,
              <AnalyticsResponseTime
                data={[
                  { label: "Alert → Ack", time: 3.2 },
                  { label: "Ack → Resolve", time: 7.5 },
                  { label: "Total Resolution", time: 12.1 },
                ]}
                loading={false}
              />,
            ].map((component, index) => (
              <div
                key={index}
                className="animate-fade-in-up premium-card rounded-2xl overflow-hidden"
                style={{ "--stagger-idx": index + 4 } as React.CSSProperties}
              >
                {component}
              </div>
            ))}

            {/* Full‑width camera health */}
            <div
              className="md:col-span-2 xl:col-span-3 animate-fade-in-up premium-card rounded-2xl overflow-hidden"
              style={{ "--stagger-idx": 16 } as React.CSSProperties}
            >
              <AnalyticsCameraHealth data={cameraHealth} loading={loading} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AnalyticsPage;
