import { useEffect, useRef } from "react";
import { getVisionStreamWsUrl } from "../api/client";

// Connects to ws://<vision-backend>/ws/stream/{streamId} — confirmed live to
// push raw JPEG frames with no wrapping (each message is a plain JPEG:
// FFD8FF... ending FFD9). Calls onFrame with each decoded HTMLImageElement,
// fully loaded and ready to draw — decoding off-screen first (rather than
// swapping an <img src> directly) avoids the tearing/corruption that shows
// up when a blob URL gets revoked while the browser is still mid-decode of
// the previous frame.
export function useLiveStreamSocket(
  streamId: string | null | undefined,
  enabled: boolean,
  onFrame: (img: HTMLImageElement, byteLength: number) => void,
  onConnectedChange?: (connected: boolean) => void,
) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onConnectedChangeRef = useRef(onConnectedChange);
  onConnectedChangeRef.current = onConnectedChange;

  useEffect(() => {
    if (!enabled || !streamId) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      ws = new WebSocket(getVisionStreamWsUrl(streamId as string));
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        if (!cancelled) onConnectedChangeRef.current?.(true);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        const byteLength: number = event.data.byteLength ?? 0;
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          if (!cancelled) onFrameRef.current(img, byteLength);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      };

      ws.onerror = () => {
        if (!cancelled) onConnectedChangeRef.current?.(false);
      };

      ws.onclose = () => {
        if (cancelled) return;
        onConnectedChangeRef.current?.(false);
        // The stream may still be starting up (or briefly dropped) — retry.
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [streamId, enabled]);
}
