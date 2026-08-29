/**
 * Classic worker — MediaPipe vision_bundle via importScripts (same-origin).
 * Assets: public/mediapipe/ (copied from node_modules on postinstall).
 */
const ORIGIN = self.location.origin;
const VISION_BUNDLE = `${ORIGIN}/mediapipe/vision_bundle.js`;
const WASM_BASE = `${ORIGIN}/mediapipe/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/latest/selfie_segmenter_landscape.tflite";

/** @type {import('@mediapipe/tasks-vision').ImageSegmenter | null} */
let segmenter = null;

/** @type {Promise<{ ImageSegmenter: typeof import('@mediapipe/tasks-vision').ImageSegmenter, FilesetResolver: typeof import('@mediapipe/tasks-vision').FilesetResolver }> | null} */
let mediapipeReady = null;

function loadMediaPipe() {
  if (!mediapipeReady) {
    mediapipeReady = new Promise((resolve, reject) => {
      try {
        importScripts(VISION_BUNDLE);
        const vision = /** @type {{ ImageSegmenter: unknown, FilesetResolver: unknown }} */ (
          globalThis.Vision ?? self.Vision
        );
        if (!vision?.ImageSegmenter || !vision?.FilesetResolver) {
          reject(new Error("Vision bundle failed to load"));
          return;
        }
        resolve(
          /** @type {{ ImageSegmenter: typeof import('@mediapipe/tasks-vision').ImageSegmenter, FilesetResolver: typeof import('@mediapipe/tasks-vision').FilesetResolver }} */ (
            vision
          ),
        );
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }
  return mediapipeReady;
}

async function ensureSegmenter() {
  if (segmenter) return segmenter;
  const { ImageSegmenter, FilesetResolver } = await loadMediaPipe();
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  segmenter = await ImageSegmenter.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "CPU",
    },
    runningMode: "IMAGE",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });
  return segmenter;
}

function closeExtraMasks(result) {
  if (result.confidenceMasks) {
    for (const m of result.confidenceMasks) {
      m.close();
    }
  }
}

function rawMaskFromResult(result) {
  const cat = result.categoryMask;
  if (cat) {
    const uint8 = cat.getAsUint8Array();
    const raw = new Float32Array(uint8.length);
    for (let i = 0; i < uint8.length; i++) {
      raw[i] = uint8[i] > 0 ? 1 : 0;
    }
    const mw = cat.width;
    const mh = cat.height;
    cat.close();
    closeExtraMasks(result);
    return { raw, mw, mh };
  }

  const conf = result.confidenceMasks?.[0];
  if (conf) {
    const raw = conf.getAsFloat32Array();
    const mw = conf.width;
    const mh = conf.height;
    closeExtraMasks(result);
    return { raw, mw, mh };
  }

  closeExtraMasks(result);
  throw new Error("segmenter returned no category or confidence mask");
}

function upscaleMask(weights, maskW, maskH, outW, outH) {
  if (maskW === outW && maskH === outH) return weights;
  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("upscaleMask: 2d unavailable");
  const src = new Uint8ClampedArray(maskW * maskH * 4);
  for (let i = 0; i < weights.length; i++) {
    const v = Math.round(Math.max(0, Math.min(1, weights[i])) * 255);
    const o = i * 4;
    src[o] = v;
    src[o + 1] = v;
    src[o + 2] = v;
    src[o + 3] = 255;
  }
  const srcCanvas = new OffscreenCanvas(maskW, maskH);
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) throw new Error("upscaleMask: src 2d unavailable");
  srcCtx.putImageData(new ImageData(src, maskW, maskH), 0, 0);
  ctx.drawImage(srcCanvas, 0, 0, outW, outH);
  const scaled = ctx.getImageData(0, 0, outW, outH).data;
  const out = new Float32Array(outW * outH);
  for (let i = 0; i < out.length; i++) {
    out[i] = scaled[i * 4] / 255;
  }
  return out;
}

function maskFromResult(result, outW, outH) {
  const { raw, mw, mh } = rawMaskFromResult(result);
  const upscaled = upscaleMask(raw, mw, mh, outW, outH);
  let sum = 0;
  for (let i = 0; i < upscaled.length; i++) sum += upscaled[i];
  if (sum < 1e-3) {
    throw new Error("segmenter returned empty mask");
  }
  return upscaled;
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  if (!msg || msg.type !== "segment") return;
  try {
    const seg = await ensureSegmenter();
    const result = seg.segment(msg.bitmap);
    msg.bitmap.close();
    const weights = maskFromResult(result, msg.width, msg.height);
    self.postMessage(
      {
        type: "ok",
        id: msg.id,
        weights,
        width: msg.width,
        height: msg.height,
      },
      { transfer: [weights.buffer] },
    );
  } catch (e) {
    try {
      msg.bitmap.close();
    } catch {
      /* ignore */
    }
    const message = e instanceof Error ? e.message : String(e);
    self.postMessage({
      type: "error",
      id: msg.id,
      code: /empty/i.test(message) ? "EMPTY" : "WORKER",
      message,
    });
  }
};
