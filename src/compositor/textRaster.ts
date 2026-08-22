import type { TextSource } from "../recipe/types";

export type RasterizedText = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

/**
 * Rasterize TextSource to a transparent canvas (premul-friendly RGBA).
 * Size is CSS-px intent; export scale policy is later (M00 C9).
 */
export function rasterizeText(text: TextSource, maxWidth = 2048): RasterizedText {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable for text raster");

  const weight =
    typeof text.fontWeight === "number" ? String(text.fontWeight) : text.fontWeight;
  const font = `${weight} ${text.fontSize}px ${text.fontFamily}`;
  ctx.font = font;

  const metrics = ctx.measureText(text.content || " ");
  const pad = Math.ceil(text.fontSize * 0.25);
  const lineHeight = text.lineHeight ?? text.fontSize * 1.2;
  const width = Math.min(
    maxWidth,
    Math.max(1, Math.ceil(metrics.width + pad * 2 + (text.letterSpacing ?? 0) * (text.content.length || 1))),
  );
  const height = Math.max(1, Math.ceil(lineHeight + pad * 2));

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.font = font;
  ctx.fillStyle = text.color;
  ctx.textBaseline = "middle";
  if (text.letterSpacing != null) {
    // letterSpacing is widely supported; keep typed loosely for older DOM libs
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      `${text.letterSpacing}px`;
  }
  const align = text.align ?? "center";
  ctx.textAlign = align;
  const x = align === "left" ? pad : align === "right" ? width - pad : width / 2;
  ctx.fillText(text.content, x, height / 2);

  return { canvas, width, height };
}
