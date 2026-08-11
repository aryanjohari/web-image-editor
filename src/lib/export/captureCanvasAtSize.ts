/**
 * Capture the live synth WebGL canvas at an exact pixel size via temporary R3F setSize.
 */

import { _roots } from "@react-three/fiber";
import {
  getPackExportViewportTarget,
  setPackExportViewport,
} from "@/lib/stage/packExportViewport";

export class PackCaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackCaptureError";
  }
}

function waitAnimationFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let left = Math.max(1, count);
    const tick = () => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function getR3fStore(canvas: HTMLCanvasElement) {
  const root = _roots.get(canvas);
  if (!root) {
    throw new PackCaptureError("WebGL root not found for synth canvas.");
  }
  return root.store;
}

export async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
  if (!blob) {
    // Fallback for environments where toBlob is stubbed / flaky
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    if (!base64) throw new PackCaptureError("Failed to encode PNG.");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Temporarily overrides R3F size/DPR to width×height (DPR=1), waits for a stable frame,
 * captures PNG bytes, then restores the previous viewport target.
 */
export async function captureCanvasPngAtSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<Uint8Array> {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const previous = getPackExportViewportTarget();

  try {
    await setPackExportViewport({ width: w, height: h });

    const state = getR3fStore(canvas).getState();
    // Belt-and-braces: ensure root state matches even if bridge was late.
    state.setDpr(1);
    state.setSize(w, h);
    state.invalidate(2);
    await waitAnimationFrames(3);

    if (canvas.width !== w || canvas.height !== h) {
      state.gl.setPixelRatio(1);
      state.gl.setSize(w, h, false);
      state.setDpr(1);
      state.setSize(w, h);
      state.invalidate(2);
      await waitAnimationFrames(2);
    }

    if (canvas.width !== w || canvas.height !== h) {
      throw new PackCaptureError(
        `Drawing buffer is ${canvas.width}×${canvas.height}, expected ${w}×${h}.`,
      );
    }

    return await canvasToPngBytes(canvas);
  } finally {
    await setPackExportViewport(previous);
    await waitAnimationFrames(2);
  }
}
