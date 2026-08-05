// src/components/Analytics/AnalyticsSummaryCards.jsx
import React, { useState, useEffect, useRef } from "react";

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Quad Easing Out formulation
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      setValue(Math.floor(easeOutQuad * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

const SummaryCard = ({ label, value, subLabel, icon, accent, loading }) => {
  const displayValue = useCountUp(value || 0);

  return (
    <div className="relative bg-white rounded-2xl p-5 flex items-center gap-4 overflow-hidden premium-card border-none shadow-none">
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: accent }}
      />

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
          color: accent,
        }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
              {displayValue.toLocaleString()}
            </p>
            {subLabel && (
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {subLabel}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AnalyticsSummaryCards = ({ data, loading }) => {
  const cards = [
    {
      label: "Cameras",
      value: data?.cameraCount ?? 0,
      subLabel: `${data?.runningCount ?? 0} active nodes`,
      icon: "📷",
      accent: "#0085D4",
    },
    {
      label: "Total Events",
      value: data?.eventCount ?? 0,
      subLabel: "Processed logs",
      icon: "⚡",
      accent: "#F84F4F",
    },
    {
      label: "Open Alerts",
      value: data?.openAlertCount ?? 0,
      subLabel: "Requires audit",
      icon: "🔔",
      accent: "#F8C94F",
    },
    {
      label: "Vehicles",
      value: data?.vehicleTotals?.current ?? 0,
      subLabel: "Active deployment",
      icon: "🚗",
      accent: "#6B4FF8",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={card.label}
          className="animate-fade-in-up group"
          style={{ "--stagger-idx": idx } as React.CSSProperties}
        >
          <SummaryCard {...card} loading={loading} />
        </div>
      ))}
    </div>
  );
};

export default AnalyticsSummaryCards;
