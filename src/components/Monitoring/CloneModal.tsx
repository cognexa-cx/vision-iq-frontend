import { useState } from "react";
import { X, Copy, Loader2 } from "lucide-react";
import { enableModule, type VisionModule } from "../../api/vision";

// Enabled modes first, then disabled — keeps the grid ordered by what's
// actually usable right now. The new AI Vision Backend documents fire/ppe/
// animal uniformly — no separate hosts/protocols per model like before.
const MODES = [
  { id: "fire", label: "Fire Detection" },
  { id: "animal", label: "Animal Detection" },
  { id: "ppe", label: "PPE Detection" },
  { id: "railway", label: "Railway Detection" },
  { id: "vehicle", label: "Vehicle Detection" },
  { id: "fall", label: "Fall Detection" },
  { id: "crowd", label: "Crowd Detection" },
  { id: "secure_area", label: "Secure Area" },
  { id: "headcount", label: "Head Count" },
];

export default function CloneModal({ cam, onClose, onCreated, onBeforeEnable }) {
  const ENABLED_MODES = new Set(["fire", "animal", "ppe"]);

  const [mode, setMode] = useState<VisionModule>("fire");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      // For an upload camera, restart its video from frame 0 first — so
      // the newly enabled model analyzes from the start instead of
      // whatever point the video happened to already be at. No-op for
      // RTSP (a live feed has no "start" to rewind to).
      await onBeforeEnable?.(cam.id);
      // Attaches a continuous ~1fps detection loop directly to the stream —
      // no separate clone object to create first, and it's live the moment
      // this call succeeds (no disabled-by-default step, since there's no
      // "enabled: false" state on the new backend, only enable/not-enabled).
      await enableModule(mode, cam.id);
      onCreated({ id: `${cam.id}::${mode}`, camera_id: cam.id, mode });
    } catch (e) {
      setError(e.message || "Failed to enable detection model.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-y-auto"
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          maxHeight: "calc(100vh - 2rem)",
        }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#EBF5FF" }}
              >
                <Copy size={15} style={{ color: "#0085D4" }} />
              </div>
              <div className="min-w-0">
                <h2
                  className="font-poppins text-[15px] font-semibold"
                  style={{ color: "#023350" }}
                >
                  Enable Detection Model
                </h2>
                <p className="font-poppins text-[11px] text-gray-400 truncate">
                  {cam.name ?? cam.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 flex-shrink-0 ml-2"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Mode selector */}
          <div className="mb-5">
            <label
              className="block font-poppins text-[12px] font-semibold mb-2"
              style={{ color: "#023350" }}
            >
              Detection Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => {
                const isEnabled = ENABLED_MODES.has(m.id);
                return (
                  <button
                    key={m.id}
                    disabled={!isEnabled}
                    onClick={() => {
                      if (!isEnabled) return;
                      setMode(m.id as VisionModule);
                    }}
                    title={isEnabled ? undefined : "Coming soon"}
                    className="px-3 py-2 rounded-xl font-poppins text-[12px] font-medium text-left transition-all"
                    style={
                      !isEnabled
                        ? {
                          background: "#F8FAFC",
                          border: "1.5px solid #E2EAF0",
                          color: "#B7C2CC",
                          cursor: "not-allowed",
                        }
                        : mode === m.id
                          ? {
                            background: "#EBF5FF",
                            border: "1.5px solid #0085D4",
                            color: "#0085D4",
                          }
                          : {
                            background: "#F8FAFC",
                            border: "1.5px solid #E2EAF0",
                            color: "#4A4A4A",
                          }
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 font-poppins text-[12px] text-red-500">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-poppins text-[13px] font-semibold transition-all hover:bg-gray-100"
              style={{ border: "1.5px solid #E2EAF0", color: "#4A4A4A" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-poppins text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "#0085D4" }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Copy size={14} />
              )}
              {loading ? "Enabling…" : "Enable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
