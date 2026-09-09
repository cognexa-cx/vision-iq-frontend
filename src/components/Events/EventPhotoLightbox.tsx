// src/components/Events/EventPhotoLightbox.tsx
// Just the image, no fields — used when the user clicks the photo itself
// rather than the row or the "View" eye icon (which open EventDetailsModal).
import { X } from "lucide-react";

export interface EventPhotoLightboxProps {
  src: string | null;
  onClose: () => void;
}

export default function EventPhotoLightbox({ src, onClose }: EventPhotoLightboxProps) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[85vh] rounded-[20px] overflow-hidden shadow-[0_20px_45px_-10px_rgba(61,12,146,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: "#F4EEFF" }}
          aria-label="Close"
        >
          <X size={16} color="#3D0C92" />
        </button>
        <img src={src} alt="Event snapshot" className="max-w-full h-auto max-h-[85vh] object-contain" />
      </div>
    </div>
  );
}
