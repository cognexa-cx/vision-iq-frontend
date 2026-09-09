// src/components/License/RenewLicenseModal.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { BRAND_GRADIENT } from "../../theme";

export interface RenewLicenseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (newKey: string) => void;
}

const inputCls =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white font-mono tracking-wide text-[#00183E] focus:outline-none focus:ring-2 focus:ring-[#3D0C92]/20";

export default function RenewLicenseModal({ open, onClose, onSubmit }: RenewLicenseModalProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setKey("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Enter a license key to activate.");
      return;
    }
    onSubmit(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-poppins" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-white rounded-[20px] shadow-[0_25px_60px_-12px_rgba(61,12,146,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: BRAND_GRADIENT }}>
          <h2 className="text-lg font-semibold text-white">Renew License</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={16} color="#fff" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">New License Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="VQ-XXXX-XXXX-XXXX-XXXX"
              autoFocus
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-poppins text-sm font-medium"
              style={{ border: "1.5px solid #D1D5DB", color: "#374151" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg font-poppins text-sm font-medium text-white"
              style={{ background: BRAND_GRADIENT }}
            >
              Activate
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
