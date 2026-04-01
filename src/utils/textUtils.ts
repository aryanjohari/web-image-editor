import * as THREE from "three";

export function createTextTexture(
  text: string,
  width: number,
  height: number,
  color: string,
  textSize: number,
): THREE.CanvasTexture | null {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, safeWidth, safeHeight);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  const safeTextSize = Math.max(1, Math.floor(textSize));
  ctx.font = `900 ${safeTextSize}px Impact, Haettenschweiler, "Arial Black", sans-serif`;
  ctx.fillText(text, safeWidth * 0.5, safeHeight * 0.5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
