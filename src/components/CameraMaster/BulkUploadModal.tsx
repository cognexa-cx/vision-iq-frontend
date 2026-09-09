// src/components/CameraMaster/BulkUploadModal.tsx
import { useState, useRef } from "react";
import { X, Loader2, UploadCloud } from "lucide-react";
import { BRAND_GRADIENT } from "../../theme";
import { parseCameraCsv, ParsedCameraRow } from "../../utils/cameraMasterHelpers";

export interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  /** Creates one camera; caller reports success/failure per row. */
  onCreateCamera: (row: ParsedCameraRow) => Promise<void>;
}

type UploadState = "idle" | "uploading" | "done";

export default function BulkUploadModal({ open, onClose, onCreateCamera }: BulkUploadModalProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedCameraRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState({ done: 0, failed: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setFileName(null);
    setRows([]);
    setSkipped(0);
    setParseError(null);
    setState("idle");
    setProgress({ done: 0, failed: 0 });
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setParseError(null);
    const text = await file.text();
    const { rows: parsed, skipped: skippedCount } = parseCameraCsv(text);
    if (parsed.length === 0) {
      setParseError("No valid rows found — expected a \"name,rtsp_url\" CSV.");
      setRows([]);
      return;
    }
    setRows(parsed);
    setSkipped(skippedCount);
  };

  const handleUpload = async () => {
    setState("uploading");
    let doneCount = 0;
    let failedCount = 0;
    for (const row of rows) {
      try {
        await onCreateCamera(row);
        doneCount++;
      } catch {
        failedCount++;
      }
      setProgress({ done: doneCount, failed: failedCount });
    }
    setState("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-poppins" onClick={handleClose}>
      <div
        className="relative w-full max-w-md bg-white rounded-[20px] shadow-[0_25px_60px_-12px_rgba(61,12,146,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: BRAND_GRADIENT }}>
          <h2 className="text-lg font-semibold text-white">Bulk Upload Cameras</h2>
          <button onClick={handleClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={16} color="#fff" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {state !== "done" && (
            <>
              <label
                htmlFor="bulk-camera-csv"
                className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer hover:bg-[#F8F5FF] transition-colors"
                style={{ borderColor: "rgba(61,12,146,0.25)" }}
              >
                <UploadCloud size={24} style={{ color: "#3D0C92" }} />
                <span className="text-sm font-medium" style={{ color: "#3D0C92" }}>
                  {fileName ?? "Click to choose a CSV file"}
                </span>
                <span className="text-[11px] text-gray-400">name,rtsp_url per row</span>
                <input
                  ref={inputRef}
                  id="bulk-camera-csv"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </label>

              {parseError && <p className="text-xs text-red-600">{parseError}</p>}
              {rows.length > 0 && (
                <p className="text-xs text-gray-500">
                  {rows.length} camera{rows.length === 1 ? "" : "s"} ready to import
                  {skipped > 0 ? ` — ${skipped} row${skipped === 1 ? "" : "s"} skipped (missing fields)` : ""}.
                </p>
              )}
            </>
          )}

          {state === "done" && (
            <p className="text-sm" style={{ color: "#00183E" }}>
              Imported <strong>{progress.done}</strong> camera{progress.done === 1 ? "" : "s"}
              {progress.failed > 0 ? `, ${progress.failed} failed` : ""}.
            </p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              onClick={handleClose}
              disabled={state === "uploading"}
              className="flex-1 py-2.5 rounded-lg font-poppins text-sm font-medium disabled:opacity-50"
              style={{ border: "1.5px solid #D1D5DB", color: "#374151" }}
            >
              {state === "done" ? "Close" : "Cancel"}
            </button>
            {state !== "done" && (
              <button
                onClick={handleUpload}
                disabled={rows.length === 0 || state === "uploading"}
                className="flex-1 py-2.5 rounded-lg font-poppins text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: BRAND_GRADIENT }}
              >
                {state === "uploading" && <Loader2 size={14} className="animate-spin" />}
                {state === "uploading" ? `Uploading ${progress.done + progress.failed}/${rows.length}` : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
