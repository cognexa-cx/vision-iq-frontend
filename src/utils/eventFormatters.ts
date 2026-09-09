// src/utils/eventFormatters.ts
// Formatting + query-param helpers shared across the Events page components.

export const formatEventDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
};

export const formatEventTime = (iso: string) => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m}${ampm}`;
};

export const formatAlertName = (type?: string) => {
  if (!type) return "—";
  return (
    type
      .split(/[_\s]+/)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ") + (type.toLowerCase().includes("detection") ? "" : " Detection")
  );
};

export interface DateRangeParams {
  start?: string;
  end?: string;
}

/** Builds { start, end } ISO bounds for a date-range filter value. */
export const buildDateRangeParams = (
  range: string,
  start?: string,
  end?: string,
): DateRangeParams => {
  const now = Date.now();
  if (range === "today") {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    return { start: s.toISOString() };
  }
  if (range === "7d") return { start: new Date(now - 7 * 86_400_000).toISOString() };
  if (range === "30d") return { start: new Date(now - 30 * 86_400_000).toISOString() };
  if (range === "custom" && start) {
    const p: DateRangeParams = { start: new Date(start).toISOString() };
    if (end) p.end = new Date(end + "T23:59:59").toISOString();
    return p;
  }
  return {};
};
