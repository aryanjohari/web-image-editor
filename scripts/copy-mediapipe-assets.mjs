#!/usr/bin/env node
/**
 * Copy MediaPipe vision_bundle.js + wasm/ into public/mediapipe for classic worker importScripts.
 * Source: node_modules/@mediapipe/tasks-vision (must include vision_bundle.js).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgRoot = join(root, "node_modules", "@mediapipe", "tasks-vision");
const outDir = join(root, "public", "mediapipe");
const bundleSrc = join(pkgRoot, "vision_bundle.js");
const wasmSrc = join(pkgRoot, "wasm");

if (!existsSync(bundleSrc)) {
  console.error(
    "copy-mediapipe-assets: vision_bundle.js missing — install @mediapipe/tasks-vision@>=1.0.1",
  );
  process.exit(1);
}
if (!existsSync(wasmSrc)) {
  console.error("copy-mediapipe-assets: wasm/ missing in @mediapipe/tasks-vision");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(bundleSrc, join(outDir, "vision_bundle.js"));
cpSync(wasmSrc, join(outDir, "wasm"), { recursive: true });

console.log("copy-mediapipe-assets: public/mediapipe/ ready");
