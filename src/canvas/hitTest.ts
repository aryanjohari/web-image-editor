/** Screen-space / NDC hit-test for Lab canvas (M07). */

import type { Recipe, TextSource, Transform2D } from "../recipe/types";

export type CanvasSelection = "text" | "overlay";

export type SizePx = { width: number; height: number };

export type NdcRect = {
  left: number;
  right: number;
  bottom: number;
  top: number;
};

export type ScreenRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Match compositor containScale (letterbox / pillarbox). */
export function containScale(
  imgW: number,
  imgH: number,
  viewW: number,
  viewH: number,
): { scaleX: number; scaleY: number } {
  const imgAspect = imgW / Math.max(imgH, 1);
  const viewAspect = viewW / Math.max(viewH, 1);
  if (imgAspect > viewAspect) {
    return { scaleX: 1, scaleY: viewAspect / imgAspect };
  }
  return { scaleX: imgAspect / viewAspect, scaleY: 1 };
}

/** Approximate text raster size without DOM (hit-test only). */
export function estimateTextSize(text: TextSource): SizePx {
  const len = Math.max(1, (text.content || " ").length);
  const fs = Math.max(1, text.fontSize);
  const pad = fs * 0.25;
  const width = Math.max(fs, len * fs * 0.55 + pad * 2 + (text.letterSpacing ?? 0) * len);
  const height = Math.max(fs, (text.lineHeight ?? fs * 1.2) + pad * 2);
  return { width, height };
}

export function objectNdcRect(
  transform: Transform2D,
  texSize: SizePx,
  viewW: number,
  viewH: number,
): NdcRect {
  const base = containScale(texSize.width, texSize.height, viewW, viewH);
  const halfX = base.scaleX * transform.scaleX;
  const halfY = base.scaleY * transform.scaleY;
  return {
    left: transform.x - halfX,
    right: transform.x + halfX,
    bottom: transform.y - halfY,
    top: transform.y + halfY,
  };
}

export function ndcRectToScreen(rect: NdcRect, viewW: number, viewH: number): ScreenRect {
  const left = ((rect.left + 1) / 2) * viewW;
  const right = ((rect.right + 1) / 2) * viewW;
  const top = ((1 - rect.top) / 2) * viewH;
  const bottom = ((1 - rect.bottom) / 2) * viewH;
  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

export function pointInNdcRect(ndcX: number, ndcY: number, rect: NdcRect, pad = 0.02): boolean {
  return (
    ndcX >= rect.left - pad &&
    ndcX <= rect.right + pad &&
    ndcY >= rect.bottom - pad &&
    ndcY <= rect.top + pad
  );
}

export type HitTestDims = {
  overlay?: SizePx | null;
  viewW: number;
  viewH: number;
};

/**
 * Hit-test selectable objects: text first, then overlay (M07 §3.2).
 * Main is never selectable.
 */
export function hitTestSelection(
  recipe: Recipe,
  ndcX: number,
  ndcY: number,
  dims: HitTestDims,
): CanvasSelection | null {
  const text = recipe.objects.find((o) => o.kind === "text");
  if (text && text.kind === "text" && text.visible) {
    const size = estimateTextSize(text.text);
    const rect = objectNdcRect(text.transform, size, dims.viewW, dims.viewH);
    if (pointInNdcRect(ndcX, ndcY, rect)) return "text";
  }

  const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
  if (overlay && overlay.kind === "image" && overlay.visible) {
    const size = dims.overlay ?? { width: 1024, height: 1024 };
    const rect = objectNdcRect(overlay.transform, size, dims.viewW, dims.viewH);
    if (pointInNdcRect(ndcX, ndcY, rect)) return "overlay";
  }

  return null;
}

export function selectionScreenRect(
  recipe: Recipe,
  selection: CanvasSelection,
  dims: HitTestDims,
): ScreenRect | null {
  if (selection === "text") {
    const text = recipe.objects.find((o) => o.kind === "text");
    if (!text || text.kind !== "text") return null;
    const ndc = objectNdcRect(
      text.transform,
      estimateTextSize(text.text),
      dims.viewW,
      dims.viewH,
    );
    return ndcRectToScreen(ndc, dims.viewW, dims.viewH);
  }
  const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
  if (!overlay || overlay.kind !== "image") return null;
  const size = dims.overlay ?? { width: 1024, height: 1024 };
  const ndc = objectNdcRect(overlay.transform, size, dims.viewW, dims.viewH);
  return ndcRectToScreen(ndc, dims.viewW, dims.viewH);
}
