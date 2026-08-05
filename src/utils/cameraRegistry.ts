// The new AI Vision Backend deletes a stream entirely on stop (confirmed
// live: GET /api/v1/streams returns it gone immediately after
// POST .../stop) — there's no "stopped but still exists" state on the
// backend. To keep a stopped camera visible in the UI instead of it just
// vanishing, we remember what was added here, client-side, and merge it
// with the live stream list in useCameras.
//
// RTSP sources are persisted to localStorage (so "Start" can recreate the
// exact same stream after a page reload). Uploaded video files are
// persisted to IndexedDB for the same reason — a plain in-memory Map would
// lose the File on any reload/navigation, which is exactly why an uploaded
// camera used to stop behaving like RTSP the moment the tab refreshed.
// IndexedDB can store Blobs/Files directly and survives reloads, giving
// uploads the same "always restartable" behavior RTSP gets for free from
// its URL.

const STORAGE_KEY = "viq_camera_registry_v1";

export interface RegistryEntry {
  name: string;
  sourceType: "rtsp" | "upload";
  rtspSource?: string;
  createdAt: number;
}

function readRegistry(): Record<string, RegistryEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeRegistry(reg: Record<string, RegistryEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reg));
}

export function getRegistry(): Record<string, RegistryEntry> {
  return readRegistry();
}

export function registerCamera(id: string, entry: RegistryEntry) {
  const reg = readRegistry();
  reg[id] = entry;
  writeRegistry(reg);
}

export function unregisterCamera(id: string) {
  const reg = readRegistry();
  delete reg[id];
  writeRegistry(reg);
  deleteUploadFile(id).catch(() => {});
}

// ─── Uploaded video files (IndexedDB) ─────────────────────────────────────
const DB_NAME = "viq_camera_files";
const STORE_NAME = "files";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export async function storeUploadFile(id: string, file: File): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUploadFile(id: string): Promise<File | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as File | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteUploadFile(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
