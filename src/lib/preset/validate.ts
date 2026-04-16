import { LAYER_IDS } from "@/store/layerEffects";
import { PRESET_SCHEMA_VERSION, type SynthPresetV1 } from "./types";

export class PresetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PresetValidationError";
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function expectNum(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new PresetValidationError(`${path} must be a finite number`);
  }
  return v;
}

export function parsePresetJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PresetValidationError("Invalid JSON");
  }
}

export function validatePresetV1(raw: unknown): SynthPresetV1 {
  if (!isRecord(raw)) {
    throw new PresetValidationError("Preset must be a JSON object");
  }
  if (raw.presetSchemaVersion !== PRESET_SCHEMA_VERSION) {
    throw new PresetValidationError(
      `Unsupported presetSchemaVersion: expected ${PRESET_SCHEMA_VERSION}, got ${String(raw.presetSchemaVersion)}`,
    );
  }
  if (typeof raw.engineVersion !== "string") {
    throw new PresetValidationError("engineVersion must be a string");
  }
  if (!isRecord(raw.synth)) {
    throw new PresetValidationError("synth must be an object");
  }
  if (!isRecord(raw.layerEffects)) {
    throw new PresetValidationError("layerEffects must be an object");
  }
  for (const id of LAYER_IDS) {
    if (!isRecord(raw.layerEffects[id])) {
      throw new PresetValidationError(`layerEffects.${id} must be an object`);
    }
  }
  if (!isRecord(raw.imageResolution)) {
    throw new PresetValidationError("imageResolution must be an object");
  }
  expectNum(raw.imageResolution.width, "imageResolution.width");
  expectNum(raw.imageResolution.height, "imageResolution.height");

  if (!isRecord(raw.viewport)) {
    throw new PresetValidationError("viewport must be an object");
  }
  expectNum(raw.viewport.drawBufferWidth, "viewport.drawBufferWidth");
  expectNum(raw.viewport.drawBufferHeight, "viewport.drawBufferHeight");
  expectNum(raw.viewport.cssWidth, "viewport.cssWidth");
  expectNum(raw.viewport.cssHeight, "viewport.cssHeight");
  expectNum(raw.viewport.dpr, "viewport.dpr");

  expectNum(raw.baseTimeSeconds, "baseTimeSeconds");

  const preset = raw as SynthPresetV1;
  if (preset.assets !== undefined && !isRecord(preset.assets)) {
    throw new PresetValidationError("assets must be an object when present");
  }
  if (preset.assets) {
    for (const key of ["background", "decal"] as const) {
      const a = preset.assets[key];
      if (a === undefined) continue;
      if (!isRecord(a) || typeof a.mime !== "string" || typeof a.dataBase64 !== "string") {
        throw new PresetValidationError(`assets.${key} must be { mime, dataBase64 }`);
      }
    }
  }

  return preset;
}
