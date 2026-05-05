export const SYNTH_CANVAS_ID = "synth-canvas" as const;

export const SYNTH_CANVAS_SELECTOR = `#${SYNTH_CANVAS_ID}` as const;

export function getSynthCanvas(): HTMLCanvasElement | null {
  const el = document.querySelector(SYNTH_CANVAS_SELECTOR);
  return el instanceof HTMLCanvasElement ? el : null;
}
