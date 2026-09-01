/** CSS pointer ↔ recipe transform helpers (M07). */

import type { Transform2D } from "../recipe/types";

export const TRANSFORM_XY_MIN = -1.5;
export const TRANSFORM_XY_MAX = 1.5;
export const TRANSFORM_SCALE_MIN = 0.15;
export const TRANSFORM_SCALE_MAX = 4;

/** Default talk nudge magnitudes (NDC / scale). */
export const DEFAULT_NUDGE_XY = 0.08;
export const DEFAULT_NUDGE_SCALE = 0.1;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampTransform(t: Transform2D): Transform2D {
  return {
    x: clamp(t.x, TRANSFORM_XY_MIN, TRANSFORM_XY_MAX),
    y: clamp(t.y, TRANSFORM_XY_MIN, TRANSFORM_XY_MAX),
    scaleX: clamp(t.scaleX, TRANSFORM_SCALE_MIN, TRANSFORM_SCALE_MAX),
    scaleY: clamp(t.scaleY, TRANSFORM_SCALE_MIN, TRANSFORM_SCALE_MAX),
    rotation: t.rotation,
  };
}

/** CSS pixel (origin top-left) → clip/NDC (Y up). */
export function cssToNdc(
  cssX: number,
  cssY: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  const w = Math.max(1, viewW);
  const h = Math.max(1, viewH);
  return {
    x: (cssX / w) * 2 - 1,
    y: 1 - (cssY / h) * 2,
  };
}

export function ndcToCss(
  ndcX: number,
  ndcY: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  return {
    x: ((ndcX + 1) / 2) * viewW,
    y: ((1 - ndcY) / 2) * viewH,
  };
}

export function applyDragDelta(
  start: Transform2D,
  dNdcX: number,
  dNdcY: number,
): Transform2D {
  return clampTransform({
    ...start,
    x: start.x + dNdcX,
    y: start.y + dNdcY,
  });
}

/**
 * Uniform scale from pointer distance to object center (screen px).
 * scale' = startScale * (currentDist / startDist).
 */
export function applyUniformScale(
  start: Transform2D,
  startDistPx: number,
  currentDistPx: number,
): Transform2D {
  const base = Math.max(1e-3, startDistPx);
  const factor = Math.max(1e-3, currentDistPx) / base;
  const next = start.scaleX * factor;
  const s = clamp(next, TRANSFORM_SCALE_MIN, TRANSFORM_SCALE_MAX);
  return clampTransform({
    ...start,
    scaleX: s,
    scaleY: s,
  });
}

export function distPx(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}
