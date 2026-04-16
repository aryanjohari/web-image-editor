import type { Texture } from "three";
import type { EmbeddedImageAsset } from "./types";

function stripDataUrlPrefix(dataUrl: string): { mime: string; dataBase64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], dataBase64: m[2] };
}

function canvasToPngAsset(canvas: HTMLCanvasElement): EmbeddedImageAsset | null {
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const parsed = stripDataUrlPrefix(dataUrl);
    return parsed;
  } catch {
    return null;
  }
}

function drawHtmlImageToCanvas(img: HTMLImageElement | HTMLCanvasElement | ImageBitmap): HTMLCanvasElement | null {
  let w: number;
  let h: number;
  if (img instanceof HTMLImageElement) {
    w = img.naturalWidth || img.width;
    h = img.naturalHeight || img.height;
  } else if (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap) {
    w = img.width;
    h = img.height;
  } else {
    w = (img as HTMLCanvasElement).width;
    h = (img as HTMLCanvasElement).height;
  }
  if (w < 1 || h < 1) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img as CanvasImageSource, 0, 0);
  return c;
}

/**
 * Encode a Three texture's image to PNG base64 when possible.
 * Skips unsupported or incomplete image sources (caller may omit asset).
 */
export async function encodeTextureToPngAsset(texture: Texture | null): Promise<EmbeddedImageAsset | null> {
  if (!texture?.image) return null;
  const image = texture.image as unknown;

  if (image instanceof HTMLCanvasElement) {
    return canvasToPngAsset(image);
  }

  if (image instanceof HTMLImageElement) {
    if (!image.complete || image.naturalWidth < 1) return null;
    const c = drawHtmlImageToCanvas(image);
    return c ? canvasToPngAsset(c) : null;
  }

  if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
    const c = drawHtmlImageToCanvas(image);
    return c ? canvasToPngAsset(c) : null;
  }

  return null;
}

export function base64ToBlob(mime: string, dataBase64: string): Blob {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
