import { ENGINE_VERSION } from "../recipe/types";
import type { Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { emptyRegional } from "../packs/regionalSliders";
import { encodeMaskPng, floatMaskToUint8 } from "./encodeMaskPng";
import type { SegmentError, SegmentResult } from "./types";
import type {
  WorkerSegmentErr,
  WorkerSegmentOk,
  WorkerSegmentRequest,
} from "./segment.worker.types";

let worker: Worker | null = null;
let reqId = 0;

function getWorker(): Worker {
  if (!worker) {
    // Classic worker — MediaPipe WASM via importScripts (not ESM self.import).
    worker = new Worker(new URL("./segment.worker.js", import.meta.url));
  }
  return worker;
}

/** Test hook: inject mask PNG bytes without MediaPipe. */
let testMaskEncoder:
  | ((bitmap: ImageBitmap, width: number, height: number) => Promise<SegmentResult | SegmentError>)
  | null = null;

export function __setTestMaskEncoder(
  fn: ((bitmap: ImageBitmap, width: number, height: number) => Promise<SegmentResult | SegmentError>) | null,
): void {
  testMaskEncoder = fn;
}

function runWorkerSegment(
  bitmap: ImageBitmap,
  width: number,
  height: number,
): Promise<SegmentResult | SegmentError> {
  const w = getWorker();
  const id = ++reqId;
  return new Promise((resolve) => {
    const onMessage = (ev: MessageEvent<WorkerSegmentOk | WorkerSegmentErr>) => {
      const data = ev.data;
      if (!data || data.id !== id) return;
      w.removeEventListener("message", onMessage);
      if (data.type === "error") {
        resolve({ code: data.code, message: data.message });
        return;
      }
      void (async () => {
        try {
          const u8 = floatMaskToUint8(data.weights, data.width, data.height);
          const blob = await encodeMaskPng(u8, data.width, data.height);
          resolve({
            blob,
            width: data.width,
            height: data.height,
            kind: "person-split",
          });
        } catch (e) {
          resolve({
            code: "ENCODE",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      })();
    };
    w.addEventListener("message", onMessage);
    const req: WorkerSegmentRequest = {
      type: "segment",
      id,
      bitmap,
      width,
      height,
    };
    w.postMessage(req, [bitmap]);
  });
}

/**
 * Segment person from a decoded main photo (M05 §5).
 * Runs MediaPipe in a Web Worker; soft-fail returns SegmentError.
 */
export async function segmentPersonMask(
  source: ImageBitmap,
): Promise<SegmentResult | SegmentError> {
  const width = source.width;
  const height = source.height;
  if (testMaskEncoder) {
    return testMaskEncoder(source, width, height);
  }
  try {
    return await runWorkerSegment(source, width, height);
  } catch (e) {
    return {
      code: "WORKER",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export function attachPersonMask(recipe: Recipe, maskAssetId: string): Recipe {
  const candidate = JSON.parse(JSON.stringify(recipe)) as Recipe;
  const main = candidate.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") {
    throw new Error("attachPersonMask: no main image");
  }
  main.maskRef = { type: "id", assetId: maskAssetId };
  main.regional = emptyRegional();
  candidate.engineVersion = ENGINE_VERSION;
  return validateRecipe(candidate);
}

export function detachPersonMask(recipe: Recipe): Recipe {
  const candidate = JSON.parse(JSON.stringify(recipe)) as Recipe;
  const main = candidate.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") return recipe;
  delete main.maskRef;
  delete main.regional;
  return validateRecipe(candidate);
}
