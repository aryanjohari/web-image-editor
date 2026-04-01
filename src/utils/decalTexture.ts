import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

const PADDING_PX = 2;

/**
 * Loads a PNG/WebP decal with alpha preserved (straight alpha, not premultiplied),
 * then crops to the tight bounds of non-transparent pixels so the sticker is only
 * the visible subject—not a full rectangular sheet of empty transparency.
 */
export async function createProcessedDecalTexture(file: File): Promise<CanvasTexture | null> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file, {
      premultiplyAlpha: "none",
      colorSpaceConversion: "default",
    });
  } catch {
    return null;
  }

  const sw = bitmap.width;
  const sh = bitmap.height;
  if (sw < 1 || sh < 1) {
    bitmap.close();
    return null;
  }

  const full = document.createElement("canvas");
  full.width = sw;
  full.height = sh;
  const fctx = full.getContext("2d", { alpha: true, willReadFrequently: true });
  if (!fctx) {
    bitmap.close();
    return null;
  }

  fctx.clearRect(0, 0, sw, sh);
  fctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = fctx.getImageData(0, 0, sw, sh);
  const bounds = computeAlphaBounds(imageData);

  let sx = 0;
  let sy = 0;
  let outW = sw;
  let outH = sh;

  if (bounds) {
    sx = Math.max(0, bounds.x - PADDING_PX);
    sy = Math.max(0, bounds.y - PADDING_PX);
    const ex = Math.min(sw, bounds.x + bounds.w + PADDING_PX);
    const ey = Math.min(sh, bounds.y + bounds.h + PADDING_PX);
    outW = ex - sx;
    outH = ey - sy;
  }

  const out = document.createElement("canvas");
  out.width = Math.max(1, outW);
  out.height = Math.max(1, outH);
  const octx = out.getContext("2d", { alpha: true });
  if (!octx) return null;

  octx.clearRect(0, 0, out.width, out.height);
  octx.drawImage(full, sx, sy, outW, outH, 0, 0, out.width, out.height);

  const texture = new CanvasTexture(out);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.premultiplyAlpha = false;
  texture.needsUpdate = true;

  return texture;
}

function computeAlphaBounds(imageData: ImageData): { x: number; y: number; w: number; h: number } | null {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const a = data[row + x * 4 + 3];
      if (a > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
