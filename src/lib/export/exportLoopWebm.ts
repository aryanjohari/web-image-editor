type ExportWebmOptions = {
  durationSec?: number;
  fps?: number;
  filename?: string;
};

export async function exportLoopWebm(
  canvas: HTMLCanvasElement,
  options: ExportWebmOptions = {},
) {
  const durationSec = options.durationSec ?? 3;
  const fps = options.fps ?? 60;
  const filename = options.filename ?? "synth-loop.webm";

  const stream = canvas.captureStream(fps);
  const mimeType = "video/webm;codecs=vp9";
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const totalFrames = Math.floor(durationSec * fps);
  for (let frame = 0; frame < totalFrames; frame += 1) {
    const t = (frame / totalFrames) * durationSec;
    (window as Window & { __SYNTH_EXPORT_TIME__?: number }).__SYNTH_EXPORT_TIME__ = t;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  recorder.stop();
  await done;

  const blob = new Blob(chunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
