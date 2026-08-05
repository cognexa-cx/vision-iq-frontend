// src/components/Analytics/AnalyticsLineChart.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

const CustomTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl p-3 shadow-xl text-xs font-poppins">
        <p className="text-gray-400 font-medium mb-1">{label}</p>
        <p style={{ color }} className="font-bold text-sm">
          {payload[0].value.toLocaleString()} Detections
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsLineChart = ({
  title,
  data,
  color,
  gradientId,
  gradientStart,
  gradientEnd,
}) => {
  const chartRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!chartRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setDims({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    ro.observe(chartRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="bg-white p-5 flex flex-col h-full border-none">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">
          {title}
        </h3>
        <button className="flex items-center gap-1.5 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
          Daily Data <ChevronDown size={12} className="text-gray-400" />
        </button>
      </div>

      <div ref={chartRef} className="flex-1 min-h-[220px] w-full relative">
        {dims.width > 0 && dims.height > 0 && (
          <AreaChart
            width={dims.width}
            height={dims.height}
            data={data}
            margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={gradientStart || color}
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor={gradientEnd || color}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
            />
            <Tooltip
              content={<CustomTooltip color={color} />}
              cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        )}
      </div>
    </div>
  );
};

export default AnalyticsLineChart;
