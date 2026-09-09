// src/pages/CameraMasterPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { getCameras, createCamera, updateCamera, deleteCamera } from "../api/cameras";
import type { Camera } from "../types/camera";
import { DUMMY_CAMERAS, CAMERA_SEAT_LIMIT } from "../data/cameraMasterData";
import { toggleDetectionTag, hasUnsavedTagChanges, buildCameraCsvTemplate, KNOWN_DETECTION_KEYS, ParsedCameraRow } from "../utils/cameraMasterHelpers";
import { ACCENT_LINE_GRADIENT, HEADING_TEXT_GRADIENT, BRAND_GRADIENT } from "../theme";
import CameraMasterStats from "../components/CameraMaster/CameraMasterStats";
import CameraMasterActionsBar from "../components/CameraMaster/CameraMasterActionsBar";
import CameraMasterTable from "../components/CameraMaster/CameraMasterTable";
import CameraFormModal, { CameraFormValues } from "../components/CameraMaster/CameraFormModal";
import BulkUploadModal from "../components/CameraMaster/BulkUploadModal";
import ConfirmModal from "../components/shared/ConfirmModal";

// Only keep the tags this page actually manages — a real camera record might
// carry other free-form tags from elsewhere; those are preserved untouched.
function detectionTagsOf(camera: Camera): string[] {
  return (camera.tags ?? []).filter((t) => KNOWN_DETECTION_KEYS.has(t));
}
function otherTagsOf(camera: Camera): string[] {
  return (camera.tags ?? []).filter((t) => !KNOWN_DETECTION_KEYS.has(t));
}

function tagMapOf(list: Camera[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  list.forEach((c) => { map[c.id] = detectionTagsOf(c); });
  return map;
}

export default function CameraMasterPage() {
  const [cameras, setCameras] = useState<Camera[]>(DUMMY_CAMERAS);
  // Seeded from the same initial DUMMY_CAMERAS so checkboxes are correct on
  // the very first render, not just after fetchCameras resolves.
  const [savedTags, setSavedTags] = useState<Record<string, string[]>>(() => tagMapOf(DUMMY_CAMERAS));
  const [draftTags, setDraftTags] = useState<Record<string, string[]>>(() => tagMapOf(DUMMY_CAMERAS));
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null);
  const [deleting, setDeleting] = useState(false);

  const syncTagsFromCameras = useCallback((list: Camera[]) => {
    const tagMap = tagMapOf(list);
    setSavedTags(tagMap);
    setDraftTags(tagMap);
  }, []);

  const fetchCameras = useCallback(async () => {
    try {
      const data = await getCameras();
      setCameras(data);
      syncTagsFromCameras(data);
    } catch {
      // Backend unreachable — fall back to sample cameras so the page stays usable.
      setCameras(DUMMY_CAMERAS);
      syncTagsFromCameras(DUMMY_CAMERAS);
    }
  }, [syncTagsFromCameras]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const isDirty = useMemo(() => hasUnsavedTagChanges(savedTags, draftTags), [savedTags, draftTags]);

  const total = cameras.length;
  const active = cameras.filter((c) => c.enabled).length;
  const remaining = Math.max(0, CAMERA_SEAT_LIMIT - total);

  const handleToggleTag = (cameraId: string, typeKey: string, checked: boolean) => {
    setDraftTags((prev) => ({ ...prev, [cameraId]: toggleDetectionTag(prev[cameraId] ?? [], typeKey, checked) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changedIds = Object.keys(draftTags).filter((id) => {
        const saved = [...(savedTags[id] ?? [])].sort();
        const draft = [...(draftTags[id] ?? [])].sort();
        return saved.length !== draft.length || saved.some((t, i) => t !== draft[i]);
      });
      await Promise.all(
        changedIds.map((id) => {
          const camera = cameras.find((c) => c.id === id);
          const tags = [...(camera ? otherTagsOf(camera) : []), ...(draftTags[id] ?? [])];
          return updateCamera(id, { tags }).catch(() => {});
        }),
      );
      await fetchCameras();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => setDraftTags(savedTags);

  const handleAddCamera = async (values: CameraFormValues) => {
    await createCamera({ name: values.name, rtsp_url: values.rtsp_url, enabled: true });
    await fetchCameras();
  };

  const handleEditCamera = async (values: CameraFormValues) => {
    if (!editingCamera) return;
    await updateCamera(editingCamera.id, { name: values.name, rtsp_url: values.rtsp_url });
    await fetchCameras();
  };

  const handleBulkCreateOne = async (row: ParsedCameraRow) => {
    await createCamera({ name: row.name, rtsp_url: row.rtsp_url, enabled: true });
  };

  const handleBulkClose = () => {
    setBulkOpen(false);
    fetchCameras();
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([buildCameraCsvTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "camera-master-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCamera(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCameras();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-poppins">
      <div className="relative flex items-center flex-shrink-0" style={{ height: 82 }}>
        <div className="flex items-center gap-3">
          <span className="w-[3px] h-[32px] rounded-full" style={{ background: ACCENT_LINE_GRADIENT, opacity: 0.84 }} />
          <h1 className="text-2xl font-semibold bg-clip-text text-transparent" style={{ backgroundImage: HEADING_TEXT_GRADIENT }}>
            My Subscription
          </h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto themed-scrollbar flex flex-col gap-4">
        <CameraMasterStats total={total} active={active} remaining={remaining} />

        <CameraMasterActionsBar
          onAddCamera={() => { setEditingCamera(null); setFormOpen(true); }}
          onBulkUpload={() => setBulkOpen(true)}
          onDownloadTemplate={handleDownloadTemplate}
        />

        <div
          className="flex-1 min-h-[360px] rounded-[20px] shadow-[0_20px_45px_-10px_rgba(61,12,146,0.18)] flex flex-col overflow-hidden"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <CameraMasterTable
            cameras={cameras}
            draftTags={draftTags}
            onToggleTag={handleToggleTag}
            onEdit={(c) => { setEditingCamera(c); setFormOpen(true); }}
            onDelete={(c) => setDeleteTarget(c)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pb-1 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="h-10 px-6 rounded-[10px] text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: BRAND_GRADIENT }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={!isDirty || saving}
            className="h-10 px-6 rounded-[10px] text-sm font-semibold bg-white disabled:opacity-50 transition-opacity"
            style={{ color: "#3D0C92", border: "1.5px solid #3D0C92" }}
          >
            Cancel
          </button>
        </div>
      </div>

      <CameraFormModal
        open={formOpen}
        camera={editingCamera}
        onClose={() => setFormOpen(false)}
        onSubmit={editingCamera ? handleEditCamera : handleAddCamera}
      />

      <BulkUploadModal open={bulkOpen} onClose={handleBulkClose} onCreateCamera={handleBulkCreateOne} />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Camera"
        message={deleteTarget ? `Remove "${deleteTarget.name}"? This cannot be undone.` : ""}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
