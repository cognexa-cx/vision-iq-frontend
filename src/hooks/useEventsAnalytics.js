// src/hooks/useEventsAnalytics.js
import { useState, useEffect, useMemo } from "react";
import { getEvents } from "../api/events";

function groupByDay(events) {
  const map = {};
  events.forEach((e) => {
    const day = new Date(e.created_at).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    if (!map[day]) map[day] = [];
    map[day].push(e);
  });
  return map;
}

export function useEventsAnalytics(pollInterval = 30000) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      // fetch last 1000 events (max allowed)
      const data = await getEvents({ limit: 1000 });
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval]);

  // ── derived analytics ──────────────────────────────────
  const analytics = useMemo(() => {
    if (!events.length) return null;

    // unique cameras
    const cameraNames = new Set(
      events.map((e) => e.camera_name).filter(Boolean),
    );
    const cameraCount = cameraNames.size;

    // by type
    const byType = {};
    events.forEach((e) => {
      byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    });

    // by camera (for incidents)
    const byCamera = {};
    events.forEach((e) => {
      const name = e.camera_name || "Unknown";
      byCamera[name] = (byCamera[name] || 0) + 1;
    });

    // severity counts
    const criticalHigh = events.filter(
      (e) => e.severity === "critical" || e.severity === "high",
    ).length;
    const totalEvents = events.length;
    const mediumResolved = events.filter((e) => e.severity === "medium").length;

    // timeseries: fall and animal per day
    const fallEvents = events.filter((e) => e.event_type === "fall");
    const animalEvents = events.filter((e) => e.event_type === "animal");
    const fallByDay = groupByDay(fallEvents);
    const animalByDay = groupByDay(animalEvents);

    const days = Object.keys({ ...fallByDay, ...animalByDay }).sort(
      (a, b) => new Date(a) - new Date(b),
    );

    const fallTimeseries = days.map((day) => ({
      date: day,
      value: fallByDay[day]?.length || 0,
    }));
    const animalTimeseries = days.map((day) => ({
      date: day,
      value: animalByDay[day]?.length || 0,
    }));

    // fall frequency (stacked bar)
    const fallFrequency = days.map((day) => {
      const dayFalls = fallByDay[day] || [];
      const critical = dayFalls.filter((e) => e.severity === "critical").length;
      const high = dayFalls.filter((e) => e.severity === "high").length;
      const medium = dayFalls.filter((e) => e.severity === "medium").length;
      return {
        day,
        falls: critical + high, // actual fall occurrences
        alerts: critical + high + medium, // all fall alerts
        resolved: medium, // resolved (medium severity)
      };
    });

    // camera incidents: top 10 cameras by event count
    const cameraIncidents = Object.entries(byCamera)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        camera_id: name,
        camera_name: name,
        count,
      }));

    // live detections from byType
    const liveDetections = Object.entries(byType).map(([type, count]) => ({
      type,
      count,
      trend: undefined,
      color:
        type === "fall" ? "#F84F4F" : type === "animal" ? "#F8C94F" : "#0085D4",
    }));

    // camera health (simplistic)
    const cameraHealth = {
      total: cameraCount,
      online: cameraCount,
      offline: 0,
      cameras: [],
    };

    // alert quality (use severity as proxy)
    const alertQuality = {
      total: totalEvents,
      true_alerts: criticalHigh,
      false_alerts: totalEvents - criticalHigh - mediumResolved,
      precision:
        totalEvents > 0 ? ((criticalHigh / totalEvents) * 100).toFixed(1) : 0,
    };

    return {
      summary: {
        cameraCount,
        runningCount: cameraCount, // all cameras assumed running
        eventCount: totalEvents,
        openAlertCount: criticalHigh,
        byType,
        byCamera,
        vehicleTotals: { current: 0, in: 0, out: 0 },
      },
      fallTimeseries,
      animalTimeseries,
      fallFrequency,
      cameraIncidents,
      liveDetections,
      cameraHealth,
      alertQuality,
      // no real AI / confidence / peak risk data
      peakRisk: null,
      modelConfidence: [],
      aiInsights: null,
    };
  }, [events]);

  return { analytics, loading, error };
}
