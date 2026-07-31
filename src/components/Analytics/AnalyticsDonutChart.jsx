// src/components/Analytics/AnalyticsDonutChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { eventsData } from "../../data/analyticsData";

const total = eventsData.reduce((sum, d) => sum + d.value, 0);

const AnalyticsDonutChart = () => {
  return (
    <div className="bg-white p-5 flex flex-col h-full border-none">
      <h3 className="text-sm font-bold text-gray-800 tracking-tight mb-2">
        Events By Vector
      </h3>

      <div className="flex flex-row items-center flex-1 min-h-0 gap-4">
        <div className="relative w-1/2 h-full flex-shrink-0 min-h-[180px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eventsData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {eventsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="outline-none focus:outline-none transition-all duration-300 hover:opacity-90"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-xl font-black text-gray-900 leading-none tracking-tight">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-1">
                Total
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3 min-w-0">
          {eventsData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-gray-600 truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-800 font-mono pl-2">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDonutChart;
