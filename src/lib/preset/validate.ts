import { LAYER_IDS } from "../../store/layerEffects";
import { MAX_TEXT_LAYERS } from "../../store/textLayers";
import {
  PRESET_SCHEMA_VERSION,
  PRESET_SCHEMA_VERSION_V1,
  type SynthPresetAny,
  type SynthPresetV1,
  type SynthPresetV2,
} from "./types";

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

function expectStr(v: unknown, path: string): string {
  if (typeof v !== "string") {
    throw new PresetValidationError(`${path} must be a string`);
  }
  return v;
}

function expectBool(v: unknown, path: string): boolean {
  if (typeof v !== "boolean") {
    throw new PresetValidationError(`${path} must be a boolean`);
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

function validateCommonTopLevel(raw: Record<string, unknown>): void {
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

  if (raw.assets !== undefined && !isRecord(raw.assets)) {
    throw new PresetValidationError("assets must be an object when present");
  }
  if (raw.assets) {
    for (const key of ["background", "decal"] as const) {
      const a = raw.assets[key];
      if (a === undefined) continue;
      if (!isRecord(a) || typeof a.mime !== "string" || typeof a.dataBase64 !== "string") {
        throw new PresetValidationError(`assets.${key} must be { mime, dataBase64 }`);
      }
    }
  }
}

export function validatePresetV1(raw: unknown): SynthPresetV1 {
  if (!isRecord(raw)) {
    throw new PresetValidationError("Preset must be a JSON object");
  }
  if (raw.presetSchemaVersion !== PRESET_SCHEMA_VERSION_V1) {
    throw new PresetValidationError(
      `Unsupported presetSchemaVersion: expected ${PRESET_SCHEMA_VERSION_V1}, got ${String(raw.presetSchemaVersion)}`,
    );
  }
  validateCommonTopLevel(raw);

  const s = raw.synth as Record<string, unknown>;
  expectStr(s.overlayText, "synth.overlayText");
  expectStr(s.textColor, "synth.textColor");
  expectNum(s.textSize, "synth.textSize");
  expectNum(s.decalScale, "synth.decalScale");
  expectNum(s.decalOffsetX, "synth.decalOffsetX");
  expectNum(s.decalOffsetY, "synth.decalOffsetY");
  expectBool(s.linkDecalToMath, "synth.linkDecalToMath");
  expectNum(s.textOffsetX, "synth.textOffsetX");
  expectNum(s.textOffsetY, "synth.textOffsetY");
  expectNum(s.textScale, "synth.textScale");
  expectBool(s.linkTextToMath, "synth.linkTextToMath");

  return raw as SynthPresetV1;
}

export function validatePresetV2(raw: unknown): SynthPresetV2 {
  if (!isRecord(raw)) {
    throw new PresetValidationError("Preset must be a JSON object");
  }
  if (raw.presetSchemaVersion !== PRESET_SCHEMA_VERSION) {
    throw new PresetValidationError(
      `Unsupported presetSchemaVersion: expected ${PRESET_SCHEMA_VERSION}, got ${String(raw.presetSchemaVersion)}`,
    );
  }
  validateCommonTopLevel(raw);

  const s = raw.synth as Record<string, unknown>;
  expectNum(s.decalScale, "synth.decalScale");
  expectNum(s.decalOffsetX, "synth.decalOffsetX");
  expectNum(s.decalOffsetY, "synth.decalOffsetY");
  if (s.decalBackgroundLumaMask !== undefined) {
    expectNum(s.decalBackgroundLumaMask, "synth.decalBackgroundLumaMask");
  }
  expectBool(s.linkDecalToMath, "synth.linkDecalToMath");
  expectBool(s.linkTextToMath, "synth.linkTextToMath");
  expectStr(s.selectedTextLayerId, "synth.selectedTextLayerId");

  if (!Array.isArray(s.textLayers)) {
    throw new PresetValidationError("synth.textLayers must be an array");
  }
  if (s.textLayers.length > MAX_TEXT_LAYERS) {
    throw new PresetValidationError(`synth.textLayers must have at most ${MAX_TEXT_LAYERS} entries`);
  }
  for (let i = 0; i < s.textLayers.length; i++) {
    const tl = s.textLayers[i];
    if (!isRecord(tl)) {
      throw new PresetValidationError(`synth.textLayers[${i}] must be an object`);
    }
    expectStr(tl.id, `synth.textLayers[${i}].id`);
    expectStr(tl.text, `synth.textLayers[${i}].text`);
    expectStr(tl.color, `synth.textLayers[${i}].color`);
    expectNum(tl.fontSize, `synth.textLayers[${i}].fontSize`);
    expectNum(tl.offsetX, `synth.textLayers[${i}].offsetX`);
    expectNum(tl.offsetY, `synth.textLayers[${i}].offsetY`);
    expectNum(tl.scale, `synth.textLayers[${i}].scale`);
    expectBool(tl.effectsLinked, `synth.textLayers[${i}].effectsLinked`);
  }

  if (!isRecord(s.textLayerEffects)) {
    throw new PresetValidationError("synth.textLayerEffects must be an object");
  }

  return raw as SynthPresetV2;
}

export function validatePreset(raw: unknown): SynthPresetAny {
  if (!isRecord(raw)) {
    throw new PresetValidationError("Preset must be a JSON object");
  }
  const v = raw.presetSchemaVersion;
  if (v === PRESET_SCHEMA_VERSION_V1) {
    return validatePresetV1(raw);
  }
  if (v === PRESET_SCHEMA_VERSION) {
    return validatePresetV2(raw);
  }
  throw new PresetValidationError(
    `Unsupported presetSchemaVersion: expected ${PRESET_SCHEMA_VERSION_V1} or ${PRESET_SCHEMA_VERSION}, got ${String(v)}`,
  );
}
