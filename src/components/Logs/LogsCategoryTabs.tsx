// src/components/Logs/LogsCategoryTabs.tsx
import { LOG_CATEGORIES, LogCategory } from "../../data/logsData";
import { BRAND_GRADIENT } from "../../theme";

export interface LogsCategoryTabsProps {
  active: LogCategory;
  onChange: (category: LogCategory) => void;
}

export default function LogsCategoryTabs({ active, onChange }: LogsCategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {LOG_CATEGORIES.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            onClick={() => onChange(category)}
            aria-pressed={isActive}
            className="h-10 px-5 rounded-full text-sm font-semibold transition-colors"
            style={
              isActive
                ? { background: BRAND_GRADIENT, color: "#fff" }
                : { background: "#EDE9FE", color: "#3D0C92" }
            }
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
