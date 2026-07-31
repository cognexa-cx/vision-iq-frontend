// src/data/analyticsData.js

export const peopleData = [
  { date: "Mon", value: 420 },
  { date: "Tue", value: 510 },
  { date: "Wed", value: 480 },
  { date: "Thu", value: 610 },
  { date: "Fri", value: 590 },
  { date: "Sat", value: 320 },
  { date: "Sun", value: 290 },
];

export const vehicleData = [
  { date: "Mon", value: 120 },
  { date: "Tue", value: 145 },
  { date: "Wed", value: 130 },
  { date: "Thu", value: 185 },
  { date: "Fri", value: 190 },
  { date: "Sat", value: 85 },
  { date: "Sun", value: 60 },
];

export const eventsData = [
  { name: "Intrusion Zones", value: 45, color: "#0085D4" },
  { name: "PPE Deficiencies", value: 30, color: "#6B4FF8" },
  { name: "Slip & Fall Alerts", value: 15, color: "#F84F4F" },
  { name: "Crowd Formations", value: 10, color: "#F8C94F" },
];

export const mockAiAnalyticsData = {
  fall_frequency: [
    { time: "08:00", incidents: 1 },
    { time: "10:00", incidents: 0 },
    { time: "12:00", incidents: 3 },
    { time: "14:00", incidents: 2 },
    { time: "16:00", incidents: 6 },
    { time: "18:00", incidents: 1 },
  ],
  peak_risk: {
    time: "14:00 - 16:00",
    index: 78,
  },
  model_confidence: [
    { step: 1, val: 94.5 },
    { step: 2, val: 95.2 },
    { step: 3, val: 94.1 },
    { step: 4, val: 96.8 },
    { step: 5, val: 96.2 },
    { step: 6, val: 97.4 },
  ],
  insights: [
    "PPE compliance down 6% near loading bays during night shifts.",
    "Vehicle congestion peaks 25 mins before scheduled transit dispatches.",
    "Camera 04 connectivity disruptions detected under high ambient temperatures.",
  ],
};

export const mockSummaryData = {
  cameraCount: 32,
  runningCount: 30,
  eventCount: 1420,
  openAlertCount: 12,
  vehicleTotals: { current: 185 },
  byCamera: {
    "01": 142,
    "04": 98,
    12: 64,
    "09": 21,
  },
  byType: {
    "Person Detections": 4250,
    "Vehicle Detections": 1840,
    "PPE Violations": 310,
    "Crowd Alerts": 95,
  },
};
