/**
 * Encode subject weight map as PNG: R = weight ∈ [0,1], G/B unused, A = 1 (M05 §3).
 */
export async function encodeMaskPng(
  weights: Uint8Array,
  width: number,
  height: number,
): Promise<Blob> {
  if (weights.length !== width * height) {
    throw new Error(`encodeMaskPng: expected ${width * height} weights, got ${weights.length}`);
  }
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < weights.length; i++) {
    const o = i * 4;
    rgba[o] = weights[i]!;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 255;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("encodeMaskPng: 2d context unavailable");
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("encodeMaskPng: toBlob returned null");
  return blob;
}

/** Float32 confidence [0,1] → Uint8 R channel. */
export function floatMaskToUint8(weights: Float32Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) {
    const w = weights[i] ?? 0;
    out[i] = Math.round(Math.max(0, Math.min(1, w)) * 255);
  }
  return out;
}
