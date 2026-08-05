import { useState, useEffect, useCallback } from "react";
import {
  getAnalyticsSummary,
  getAnalyticsTimeseries,
  getAIAnalytics,
} from "../api/analytics";

// ─── useAnalyticsSummary ──────────────────────────────────────────────────────
export function useAnalyticsSummary(params = {}, pollInterval = 15000) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const raw = await getAnalyticsSummary(params);
      // Map actual API shape:
      // { camera_count, clone_count, running_count, running_clone_count,
      //   event_count, open_alert_count, by_type, by_camera, vehicle_totals }
      setSummary({
        cameraCount: raw.camera_count ?? 0,
        cloneCount: raw.clone_count ?? 0,
        runningCount: raw.running_count ?? 0,
        runningClones: raw.running_clone_count ?? 0,
        eventCount: raw.event_count ?? 0,
        openAlertCount: raw.open_alert_count ?? 0,
        byType: raw.by_type ?? {},
        byCamera: raw.by_camera ?? {},
        vehicleTotals: raw.vehicle_totals ?? { in: 0, out: 0, current: 0 },
        device: raw.device ?? "—",
        modelLoaded: raw.model_loaded ?? false,
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, pollInterval);
    return () => clearInterval(id);
  }, [fetchSummary, pollInterval]);

  return { summary, loading, error, refetch: fetchSummary };
}

// ─── useAnalyticsTimeseries ───────────────────────────────────────────────────
export function useAnalyticsTimeseries(params = {}, pollInterval = 60000) {
  const [fall, setFall] = useState([]);
  const [animal, setAnimal] = useState([]);
  const [total, setTotal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const raw = await getAnalyticsTimeseries(params);
      // Actual shape: [{ time, animal, fall, intrusion, night, total }]
      function label(ts) {
        try {
          const d = new Date(ts);
          return d.toLocaleDateString([], { day: "numeric", month: "short" });
        } catch {
          return String(ts);
        }
      }

      if (Array.isArray(raw)) {
        setFall(raw.map((r) => ({ date: label(r.time), value: r.fall ?? 0 })));
        setAnimal(
          raw.map((r) => ({ date: label(r.time), value: r.animal ?? 0 })),
        );
        setTotal(
          raw.map((r) => ({ date: label(r.time), value: r.total ?? 0 })),
        );
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollInterval);
    return () => clearInterval(id);
  }, [fetch, pollInterval]);

  return { fall, animal, total, loading, error };
}

// ─── useAiAnalytics ───────────────────────────────────────────────────────────
export function useAiAnalytics(mode = "hourly", pollInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const raw = await getAIAnalytics({ mode });
      setData(raw);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, pollInterval);
    return () => clearInterval(id);
  }, [fetch, pollInterval]);

  return { data, loading, error, refetch: fetch };
}
