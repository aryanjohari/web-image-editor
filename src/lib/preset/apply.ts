import {
  createDefaultLayerEffects,
  LAYER_IDS,
  type LayerEffectParams,
  type LayerEffectsMap,
} from "@/store/layerEffects";
import { MAX_TEXT_LAYERS, type TextLayer } from "@/store/textLayers";
import { useSynthStore } from "@/store/useSynthStore";
import type { SynthPresetV2 } from "./types";
import { PresetValidationError } from "./validate";

/** Partial runtime update for mood/AI — not a preset file; no schema version. */
export type PresetPatch = {
  layerEffects?: Partial<{
    background?: Partial<LayerEffectParams>;
    decal?: Partial<LayerEffectParams>;
    text?: Partial<LayerEffectParams>;
  }>;
  synth?: Partial<{
    decalScale?: number;
    decalOffsetX?: number;
    decalOffsetY?: number;
    decalBackgroundLumaMask?: number;
    linkDecalToMath?: boolean;
    linkTextToMath?: boolean;
    textLayers?: TextLayer[];
    selectedTextLayerId?: string;
    textLayerEffects?: Record<string, Partial<LayerEffectParams>>;
  }>;
};

const NUMERIC_LAYER_EFFECT_KEYS: (keyof LayerEffectParams)[] = [
  "meltIntensity",
  "colorBleed",
  "noiseLevel",
  "posterizeSteps",
  "timeScale",
  "maskCenterX",
  "maskCenterY",
  "maskRadius",
  "twirlIntensity",
  "duotoneBlend",
  "colorCycleSpeed",
  "halftoneIntensity",
  "scanlineIntensity",
];

function expectPatchNum(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new PresetValidationError(`${path} must be a finite number`);
  }
  return v;
}

function expectPatchBool(v: unknown, path: string): boolean {
  if (typeof v !== "boolean") {
    throw new PresetValidationError(`${path} must be a boolean`);
  }
  return v;
}

function expectPatchStr(v: unknown, path: string): string {
  if (typeof v !== "string") {
    throw new PresetValidationError(`${path} must be a string`);
  }
  return v;
}

function validateLayerEffectPartial(partial: Partial<LayerEffectParams>, path: string): void {
  for (const key of NUMERIC_LAYER_EFFECT_KEYS) {
    if (partial[key] !== undefined) {
      expectPatchNum(partial[key], `${path}.${key}`);
    }
  }
  if (partial.colorA !== undefined) {
    expectPatchStr(partial.colorA, `${path}.colorA`);
  }
  if (partial.colorB !== undefined) {
    expectPatchStr(partial.colorB, `${path}.colorB`);
  }
}

function validateTextLayers(layers: TextLayer[]): void {
  if (layers.length > MAX_TEXT_LAYERS) {
    throw new PresetValidationError(`textLayers must have at most ${MAX_TEXT_LAYERS} entries`);
  }
  for (let i = 0; i < layers.length; i++) {
    const tl = layers[i];
    expectPatchStr(tl.id, `synth.textLayers[${i}].id`);
    expectPatchStr(tl.text, `synth.textLayers[${i}].text`);
    expectPatchStr(tl.color, `synth.textLayers[${i}].color`);
    expectPatchNum(tl.fontSize, `synth.textLayers[${i}].fontSize`);
    expectPatchNum(tl.offsetX, `synth.textLayers[${i}].offsetX`);
    expectPatchNum(tl.offsetY, `synth.textLayers[${i}].offsetY`);
    expectPatchNum(tl.scale, `synth.textLayers[${i}].scale`);
    expectPatchBool(tl.effectsLinked, `synth.textLayers[${i}].effectsLinked`);
  }
}

export function mergeLayerEffectsPatch(
  current: LayerEffectsMap,
  patch: PresetPatch["layerEffects"],
): LayerEffectsMap {
  if (!patch) return current;

  const next = { ...current };
  for (const layerId of LAYER_IDS) {
    const layerPatch = patch[layerId];
    if (layerPatch) {
      validateLayerEffectPartial(layerPatch, `layerEffects.${layerId}`);
      next[layerId] = { ...current[layerId], ...layerPatch };
    }
  }
  return next;
}

export function applySynthFieldsFromV2(preset: SynthPresetV2): void {
  const store = useSynthStore.getState();
  const { synth } = preset;
  store.replaceLayerEffects(structuredClone(preset.layerEffects));
  store.setParam("decalScale", synth.decalScale);
  store.setParam("decalOffsetX", synth.decalOffsetX);
  store.setParam("decalOffsetY", synth.decalOffsetY);
  store.setParam("decalBackgroundLumaMask", synth.decalBackgroundLumaMask ?? 0);
  store.setParam("linkDecalToMath", synth.linkDecalToMath);
  store.setParam("linkTextToMath", synth.linkTextToMath);
  store.setTextLayers(structuredClone(synth.textLayers));
  const ids = new Set(synth.textLayers.map((l) => l.id));
  const selected =
    synth.selectedTextLayerId && ids.has(synth.selectedTextLayerId)
      ? synth.selectedTextLayerId
      : (synth.textLayers[0]?.id ?? "");
  store.setSelectedTextLayerId(selected);
  store.setTextLayerEffects(structuredClone(synth.textLayerEffects));
}

/** Apply synth fields only — never loads assets or clears uploads. */
export function applyStylePreset(preset: SynthPresetV2): void {
  applySynthFieldsFromV2(preset);
}

export function applyPresetPatch(patch: PresetPatch): void {
  const store = useSynthStore.getState();

  if (patch.layerEffects) {
    const merged = mergeLayerEffectsPatch(store.layerEffects, patch.layerEffects);
    store.replaceLayerEffects(merged);
  }

  const synthPatch = patch.synth;
  if (!synthPatch) return;

  const scalarKeys = [
    "decalScale",
    "decalOffsetX",
    "decalOffsetY",
    "decalBackgroundLumaMask",
    "linkDecalToMath",
    "linkTextToMath",
  ] as const;

  for (const key of scalarKeys) {
    const value = synthPatch[key];
    if (value === undefined) continue;
    if (key === "linkDecalToMath" || key === "linkTextToMath") {
      store.setParam(key, expectPatchBool(value, `synth.${key}`));
    } else {
      store.setParam(key, expectPatchNum(value, `synth.${key}`));
    }
  }

  if (synthPatch.textLayers !== undefined) {
    validateTextLayers(synthPatch.textLayers);
    store.setTextLayers(structuredClone(synthPatch.textLayers));
  }

  if (synthPatch.selectedTextLayerId !== undefined) {
    const textLayers = useSynthStore.getState().textLayers;
    const ids = new Set(textLayers.map((l) => l.id));
    const selected = ids.has(synthPatch.selectedTextLayerId)
      ? synthPatch.selectedTextLayerId
      : (textLayers[0]?.id ?? "");
    store.setSelectedTextLayerId(selected);
  }

  if (synthPatch.textLayerEffects !== undefined) {
    const current = useSynthStore.getState().textLayerEffects;
    const merged = { ...current };
    for (const [id, partial] of Object.entries(synthPatch.textLayerEffects)) {
      validateLayerEffectPartial(partial, `synth.textLayerEffects.${id}`);
      merged[id] = {
        ...(current[id] ?? createDefaultLayerEffects()),
        ...partial,
      };
    }
    store.setTextLayerEffects(merged);
  }
}
