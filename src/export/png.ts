import type { AssetRecord } from "../assets/types";
import type { Compositor } from "../compositor/renderer";
import type { Recipe } from "../recipe/types";
import { triggerDownload } from "./download";

export class ExportError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ExportError";
    this.code = code;
  }
}

function clampExportSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const m = Math.max(width, height);
  if (m <= maxEdge) return { width, height };
  const scale = maxEdge / m;
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

/** Flip GL bottom-up RGBA into top-down for Canvas2D. */
export function flipYRgba(
  pixels: Uint8Array,
  width: number,
  height: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);
  const row = width * 4;
  for (let y = 0; y < height; y++) {
    const src = (height - 1 - y) * row;
    const dst = y * row;
    out.set(pixels.subarray(src, src + row), dst);
  }
  return out;
}

export async function pixelsToPngBlob(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<Blob> {
  const flipped = flipYRgba(pixels, width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ExportError("CANVAS2D", "2d context unavailable for PNG encode");
  ctx.putImageData(new ImageData(flipped, width, height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new ExportError("TOBLOB", "canvas.toBlob returned null");
  return blob;
}

/**
 * Export PNG via export-FBO readback at main native size (clamped).
 * Same GLSL as preview; never preserveDrawingBuffer on CSS canvas.
 */
export async function exportPng(
  compositor: Compositor,
  recipe: Recipe,
  assetsById: Map<string, AssetRecord>,
  previewHeight: number,
): Promise<Blob> {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image" || !main.visible) {
    throw new ExportError("MISSING_MAIN", "main image missing — cannot export PNG");
  }
  if (main.source.type === "id" && !assetsById.has(main.source.assetId)) {
    throw new ExportError(
      "MISSING_MAIN",
      `main asset "${main.source.assetId}" missing — re-upload`,
    );
  }
  if (main.maskRef?.type === "id" && !assetsById.has(main.maskRef.assetId)) {
    throw new ExportError(
      "MISSING_MASK",
      `mask asset "${main.maskRef.assetId}" missing — regenerate or re-upload`,
    );
  }

  const native = await compositor.resolveMainNativeSize(recipe, assetsById);
  const maxEdge = compositor.maxTextureSize();
  const size = clampExportSize(native.width, native.height, maxEdge);

  const { width, height, pixels } = await compositor.exportPixels(
    { recipe, assetsById },
    size.width,
    size.height,
    previewHeight,
  );
  return pixelsToPngBlob(pixels, width, height);
}

export async function downloadPng(
  compositor: Compositor,
  recipe: Recipe,
  assetsById: Map<string, AssetRecord>,
  previewHeight: number,
  filename = "prism-export.png",
): Promise<void> {
  const blob = await exportPng(compositor, recipe, assetsById, previewHeight);
  triggerDownload(blob, filename);
}
