import type { SynthPresetViewport } from "./types";

export function readCanvasViewportSnapshot(canvas: HTMLCanvasElement): SynthPresetViewport {
  const drawBufferWidth = Math.max(1, canvas.width);
  const drawBufferHeight = Math.max(1, canvas.height);
  const cssWidth = Math.max(1, canvas.clientWidth);
  const cssHeight = Math.max(1, canvas.clientHeight);
  const dpr = drawBufferWidth / cssWidth;
  return {
    drawBufferWidth,
    drawBufferHeight,
    cssWidth,
    cssHeight,
    dpr,
  };
}

export function getLastBaseTimeSeconds(): number {
  const w = window as Window & { __SYNTH_LAST_BASE_TIME__?: number };
  const t = w.__SYNTH_LAST_BASE_TIME__;
  return typeof t === "number" && Number.isFinite(t) ? t : 0;
}
