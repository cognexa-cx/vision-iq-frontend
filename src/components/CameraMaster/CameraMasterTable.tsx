// src/components/CameraMaster/CameraMasterTable.tsx
import { Trash2, Pencil } from "lucide-react";
import type { Camera } from "../../types/camera";
import { DETECTION_TYPES } from "../../data/cameraMasterData";
import { countCamerasWithType } from "../../utils/cameraMasterHelpers";
import { ICON_BUTTON_BG, ICON_BUTTON_COLOR } from "../../theme";

export interface CameraMasterTableProps {
  cameras: Camera[];
  draftTags: Record<string, string[]>;
  onToggleTag: (cameraId: string, typeKey: string, checked: boolean) => void;
  onEdit: (camera: Camera) => void;
  onDelete: (camera: Camera) => void;
}

const headerCellCls = "px-2 text-sm font-semibold";
const rowCellCls = "px-2 text-sm";

export default function CameraMasterTable({ cameras, draftTags, onToggleTag, onEdit, onDelete }: CameraMasterTableProps) {
  const usageByType = Object.fromEntries(
    DETECTION_TYPES.map((t) => [t.key, countCamerasWithType(draftTags, t.key)]),
  );

  return (
    <div className="flex-1 min-h-0 overflow-auto themed-scrollbar">
      <table className="text-left" style={{ tableLayout: "fixed", borderCollapse: "separate", minWidth: 900, width: "100%" }}>
        <colgroup>
          <col style={{ width: 80 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 160 }} />
          {DETECTION_TYPES.map((t) => <col key={t.key} style={{ width: 170 }} />)}
          <col style={{ width: 90 }} />
        </colgroup>
        <thead style={{ position: "sticky", top: 0, background: "#F8F8FE", zIndex: 1 }}>
          <tr style={{ height: 56 }}>
            <th className={`${headerCellCls} pl-6`} style={{ color: "#003473" }}>Sr.No.</th>
            <th className={headerCellCls} style={{ color: "#003473" }}>Zone No.</th>
            <th className={headerCellCls} style={{ color: "#003473" }}>Camera Name</th>
            {DETECTION_TYPES.map((t) => (
              <th key={t.key} className={headerCellCls} style={{ color: "#003473" }}>
                {t.label} <span className="text-xs font-normal text-gray-400">({usageByType[t.key]}/{t.max})</span>
              </th>
            ))}
            <th className={headerCellCls} style={{ color: "#003473" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {cameras.length === 0 ? (
            <tr>
              <td colSpan={4 + DETECTION_TYPES.length} className="px-8 py-16 text-center text-gray-400 text-sm">
                No cameras yet — add one to get started.
              </td>
            </tr>
          ) : (
            cameras.map((camera, idx) => {
              const tags = draftTags[camera.id] ?? [];
              return (
                <tr key={camera.id} className="border-t hover:bg-[#F8F5FF] transition-colors" style={{ height: 56, borderColor: "#F0F0F0" }}>
                  <td className={`${rowCellCls} pl-6`} style={{ color: "#00183E" }}>{String(idx + 1).padStart(2, "0")}.</td>
                  <td className={rowCellCls} style={{ color: "#00183E" }}>Zone {String(idx + 1).padStart(2, "0")}</td>
                  <td className={`${rowCellCls} truncate`} style={{ color: "#00183E" }}>{camera.name}</td>
                  {DETECTION_TYPES.map((t) => {
                    const checked = tags.includes(t.key);
                    const limitReached = !checked && usageByType[t.key] >= t.max;
                    return (
                      <td key={t.key} className={rowCellCls}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={limitReached}
                          onChange={(e) => onToggleTag(camera.id, t.key, e.target.checked)}
                          aria-label={`${t.label} for ${camera.name}`}
                          title={limitReached ? `Limit reached (${t.max}/${t.max})` : undefined}
                          className="w-4 h-4 rounded accent-[#3D0C92] disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                    );
                  })}
                  <td className={rowCellCls}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDelete(camera)}
                        aria-label={`Delete ${camera.name}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: ICON_BUTTON_BG }}
                      >
                        <Trash2 size={14} color={ICON_BUTTON_COLOR} />
                      </button>
                      <button
                        onClick={() => onEdit(camera)}
                        aria-label={`Edit ${camera.name}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: ICON_BUTTON_BG }}
                      >
                        <Pencil size={14} color={ICON_BUTTON_COLOR} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
