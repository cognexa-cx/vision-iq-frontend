// src/components/CameraMaster/CameraMasterActionsBar.tsx
import { Plus, Upload, Download } from "lucide-react";
import { BRAND_GRADIENT } from "../../theme";

export interface CameraMasterActionsBarProps {
  onAddCamera: () => void;
  onBulkUpload: () => void;
  onDownloadTemplate: () => void;
}

export default function CameraMasterActionsBar({ onAddCamera, onBulkUpload, onDownloadTemplate }: CameraMasterActionsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        onClick={onAddCamera}
        className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-white text-sm font-semibold"
        style={{ background: BRAND_GRADIENT }}
      >
        Add Camera <Plus size={16} />
      </button>
      <button
        onClick={onBulkUpload}
        className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-white text-sm font-semibold"
        style={{ background: BRAND_GRADIENT }}
      >
        Bulk Upload <Upload size={15} />
      </button>
      <button
        onClick={onDownloadTemplate}
        className="flex items-center gap-2 h-10 px-4 rounded-[10px] text-sm font-semibold bg-white"
        style={{ color: "#3D0C92", border: "1.5px solid #3D0C92" }}
      >
        Download Template <Download size={15} />
      </button>
    </div>
  );
}
