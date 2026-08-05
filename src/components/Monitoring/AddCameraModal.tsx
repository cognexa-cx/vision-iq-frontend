import { useState } from "react";
import { X, Loader2, UploadCloud } from "lucide-react";
import { startRtspStream, uploadStream } from "../../api/vision";
import { registerCamera, storeUploadFile } from "../../utils/cameraRegistry";

// Two top-level source options: a live RTSP camera, or a video file upload
// (POST /api/v1/streams/upload — the new AI Vision Backend decodes/loops
// the file the same way it would an RTSP stream).
const CAMERA_SOURCES = [
  { id: "rtsp", label: "RTSP Link" },
  { id: "upload", label: "Upload Video" },
];

const inputClass = `w-full px-4 py-3 rounded-lg font-poppins text-[14px] outline-none transition-colors`;
const inputStyle = { border: "1.5px solid #D1E3F0", color: "#01397C" };
const focusStyle = { borderColor: "#01397C" };
const blurStyle = { borderColor: "#D1E3F0" };

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-poppins text-[13px] sm:text-[14px] font-medium"
        style={{ color: "#01397C" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2.5 rounded-lg font-poppins text-[13px] font-semibold transition-all"
      style={
        active
          ? {
              background: "linear-gradient(180deg, #05517E 0%, #0085D4 100%)",
              color: "#fff",
            }
          : { background: "#F1F5F9", color: "#64748b" }
      }
    >
      {children}
    </button>
  );
}

export default function AddCameraModal({
  onClose,
  onAdded = () => {},
}: {
  onClose: () => void;
  onAdded?: () => void;
}) {
  const [cameraSource, setCameraSource] = useState("rtsp");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    source: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setError(null);

    // The stream_id doubles as the display name — the new backend has no
    // separate "name" field on a stream. If left blank, generate one so the
    // name field can stay optional.
    const streamId = form.name.trim()
      ? form.name.trim().replace(/\s+/g, "-")
      : `camera-${Date.now()}`;
    const displayName = form.name.trim() || streamId;

    if (cameraSource === "upload") {
      if (!videoFile) {
        setError("Please choose a video file to upload.");
        return;
      }
      setSaving(true);
      setUploadProgress(0);
      try {
        await uploadStream(videoFile, setUploadProgress, streamId);
        // Remembered so the camera can stay visible (and be restarted) once
        // stopped — the backend itself deletes the stream on stop.
        registerCamera(streamId, {
          name: displayName,
          sourceType: "upload",
          createdAt: Date.now(),
        });
        await storeUploadFile(streamId, videoFile);
        onAdded?.();
        onClose();
      } catch (e) {
        setError(
          e.message || "Failed to upload video. Check the backend connection.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!form.source.trim()) {
      setError("RTSP link is required.");
      return;
    }

    setSaving(true);
    try {
      await startRtspStream(form.source.trim(), streamId);
      registerCamera(streamId, {
        name: displayName,
        sourceType: "rtsp",
        rtspSource: form.source.trim(),
        createdAt: Date.now(),
      });
      onAdded?.();
      onClose();
    } catch (e) {
      setError(
        e.message || "Failed to add camera. Check the backend connection.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[680px] relative flex flex-col max-h-[90vh]"
        style={{
          border: "1px solid #E8EFF5",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8 pb-5 flex-shrink-0">
          <h2
            className="font-poppins text-[18px] sm:text-[22px] font-semibold"
            style={{ color: "#01397C" }}
          >
            Add Camera
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(180deg, #05517E 0%, #0085D4 100%)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 sm:px-8 pb-6 sm:pb-8">
          {/* Camera source: RTSP vs Upload */}
          <div className="flex gap-2 mb-5">
            {CAMERA_SOURCES.map((s) => (
              <TabButton
                key={s.id}
                active={cameraSource === s.id}
                onClick={() => setCameraSource(s.id)}
              >
                {s.label}
              </TabButton>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-5">
            {/* Camera Name */}
            <Field label="Camera Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => Object.assign(e.target.style, blurStyle)}
              />
            </Field>

            {/* RTSP: paste full URL */}
            {cameraSource === "rtsp" && (
              <div className="sm:col-span-2 flex flex-col gap-3">
                <Field label="Full RTSP URL *">
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => set("source", e.target.value)}
                    placeholder="rtsp://admin:pass%40123@192.168.10.89:554/stream1"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, blurStyle)}
                  />
                </Field>
                <p className="font-poppins text-[11px] text-gray-400 leading-relaxed">
                  💡 Paste the complete RTSP URL including credentials. Special
                  characters in passwords must be URL-encoded (e.g.&nbsp;
                  <span className="font-mono" style={{ color: "#0085D4" }}>
                    @
                  </span>
                  &nbsp;→&nbsp;
                  <span className="font-mono" style={{ color: "#0085D4" }}>
                    %40
                  </span>
                  ).
                </p>
              </div>
            )}

            {/* Upload video file */}
            {cameraSource === "upload" && (
              <div className="sm:col-span-2">
                <Field label="Video File *">
                  <label
                    className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg cursor-pointer transition-colors"
                    style={{
                      border: "1.5px dashed #D1E3F0",
                      background: videoFile ? "#EBF5FF" : "transparent",
                    }}
                  >
                    <UploadCloud size={22} style={{ color: "#0085D4" }} />
                    <span
                      className="font-poppins text-[13px] font-medium"
                      style={{ color: "#01397C" }}
                    >
                      {videoFile ? videoFile.name : "Click to choose a video file"}
                    </span>
                    {videoFile && (
                      <span className="font-poppins text-[11px] text-gray-400">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) =>
                        setVideoFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </Field>
                <p className="font-poppins text-[11px] text-gray-400 mt-2 leading-relaxed">
                  💡 The video is registered as a camera source — it decodes
                  and loops the same way a live RTSP feed would.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 font-poppins text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              ⚠️ {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 sm:mt-8">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 sm:px-8 py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ border: "1.5px solid #01397C", color: "#01397C" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 sm:px-8 py-2.5 rounded-lg font-poppins text-[13px] sm:text-[14px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
              style={{
                background: "linear-gradient(180deg, #05517E 0%, #0085D4 100%)",
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving
                ? cameraSource === "upload"
                  ? `Uploading… ${uploadProgress}%`
                  : "Saving…"
                : cameraSource === "upload"
                  ? "Upload Camera"
                  : "Save Camera"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
