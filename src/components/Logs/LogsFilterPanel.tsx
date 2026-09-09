// src/components/Logs/LogsFilterPanel.tsx
import { useEffect } from "react";
import { X } from "lucide-react";

const selectCls =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3D0C92]/20";

export interface LogsFilterPanelProps {
  status: string;
  setStatus: (v: string) => void;
  onClose: () => void;
  onClearAll: () => void;
  isFiltered: boolean;
}

export default function LogsFilterPanel({ status, setStatus, onClose, onClearAll, isFiltered }: LogsFilterPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] w-[260px] bg-white rounded-2xl shadow-[0_20px_45px_-10px_rgba(61,12,146,0.25)] border border-[rgba(97,32,214,0.08)] p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <p className="font-poppins text-sm font-semibold" style={{ color: "#00183E" }}>Filters</p>
        <div className="flex items-center gap-3">
          {isFiltered && (
            <button onClick={onClearAll} className="text-xs font-semibold hover:underline" style={{ color: "#3D0C92" }}>
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close filters">
            <X size={16} />
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="all">All Statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Warning">Warning</option>
        </select>
      </div>
    </div>
  );
}
