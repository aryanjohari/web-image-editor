import * as THREE from "three";

function buildFont(size: number): string {
  return `900 ${Math.max(1, Math.floor(size))}px Impact, Haettenschweiler, "Arial Black", sans-serif`;
}

/** Split a paragraph into lines that fit within maxWidth (CSS pixels). */
function wrapParagraph(ctx: CanvasRenderingContext2D, paragraph: string, maxWidth: number): string[] {
  const trimmed = paragraph.trim();
  if (trimmed.length === 0) {
    return [""];
  }
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
      }
      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        let chunk = "";
        for (const ch of word) {
          const next = chunk + ch;
          if (ctx.measureText(next).width <= maxWidth) {
            chunk = next;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

function layoutLines(
  text: string,
  ctx: CanvasRenderingContext2D,
  maxWidth: number,
): string[] {
  const rawParagraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of rawParagraphs) {
    const wrapped = wrapParagraph(ctx, para, maxWidth);
    for (const w of wrapped) {
      lines.push(w);
    }
  }
  return lines;
}

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

  const safeTextSize = Math.max(1, Math.floor(textSize));
  ctx.clearRect(0, 0, safeWidth, safeHeight);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = buildFont(safeTextSize);

  const maxLineWidth = Math.max(safeWidth * 0.92, safeTextSize);
  const lines = layoutLines(text, ctx, maxLineWidth);
  const lineHeight = safeTextSize * 1.2;
  const blockHeight = lines.length * lineHeight;
  const centerY = safeHeight * 0.5;
  const startY = centerY - blockHeight * 0.5 + lineHeight * 0.5;

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight;
    ctx.fillText(lines[i], safeWidth * 0.5, y);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
