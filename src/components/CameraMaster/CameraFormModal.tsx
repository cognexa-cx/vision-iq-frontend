// src/components/CameraMaster/CameraFormModal.tsx
import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { BRAND_GRADIENT } from "../../theme";
import type { Camera } from "../../types/camera";

export interface CameraFormValues {
  name: string;
  rtsp_url: string;
}

export interface CameraFormModalProps {
  open: boolean;
  camera?: Camera | null; // present → edit mode, absent → add mode
  onClose: () => void;
  onSubmit: (values: CameraFormValues) => Promise<void>;
}

const inputCls =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-[#00183E] focus:outline-none focus:ring-2 focus:ring-[#3D0C92]/20";

export default function CameraFormModal({ open, camera, onClose, onSubmit }: CameraFormModalProps) {
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(camera?.name ?? "");
    setRtspUrl(camera?.rtsp_url ?? "");
    setError(null);
  }, [open, camera]);

  if (!open) return null;

  const isEdit = Boolean(camera);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rtspUrl.trim()) {
      setError("Camera name and RTSP URL are both required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), rtsp_url: rtspUrl.trim() });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-poppins" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white rounded-[20px] shadow-[0_25px_60px_-12px_rgba(61,12,146,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: BRAND_GRADIENT }}>
          <h2 className="text-lg font-semibold text-white">{isEdit ? "Edit Camera" : "Add Camera"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={16} color="#fff" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Camera Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Gate" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">RTSP URL</label>
            <input value={rtspUrl} onChange={(e) => setRtspUrl(e.target.value)} placeholder="rtsp://user:pass@host:554/stream" className={inputCls} />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-poppins text-sm font-medium disabled:opacity-50"
              style={{ border: "1.5px solid #D1D5DB", color: "#374151" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg font-poppins text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: BRAND_GRADIENT }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Add Camera"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
