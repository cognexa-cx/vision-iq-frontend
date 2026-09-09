// src/components/Events/EventsPagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BRAND_GRADIENT } from "../../theme";

export interface EventsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function EventsPagination({
  currentPage, totalPages, totalItems, itemsPerPage, onPageChange,
}: EventsPaginationProps) {
  if (totalPages <= 1) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const range: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      range.push(i);
    }
  }
  const withEllipsis: (number | "…")[] = [];
  let prev: number | null = null;
  for (const p of range) {
    if (prev !== null && p - prev > 1) withEllipsis.push("…");
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <div className="flex items-center justify-between px-8 py-3 border-t border-gray-100 flex-shrink-0">
      <span className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
        <span className="font-semibold text-gray-600">{totalItems}</span> events
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
        >
          <ChevronLeft size={14} />
        </button>

        {withEllipsis.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-xs text-gray-400 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="w-7 h-7 text-xs font-medium rounded-lg transition"
              style={
                p === currentPage
                  ? { background: BRAND_GRADIENT, color: "#FFFFFF" }
                  : { color: "#00183E", border: "1px solid #E5E7EB" }
              }
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
