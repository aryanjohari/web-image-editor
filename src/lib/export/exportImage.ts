export function exportCanvasPng(
  canvas: HTMLCanvasElement,
  filename = "synth-export.png",
  scale = 1,
) {
  const width = Math.max(1, Math.floor(canvas.width * scale));
  const height = Math.max(1, Math.floor(canvas.height * scale));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const ctx = output.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(canvas, 0, 0, width, height);

  const url = output.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
