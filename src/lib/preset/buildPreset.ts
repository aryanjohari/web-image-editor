import type { LayerEffectsMap } from "@/store/layerEffects";
import type { SynthParams } from "@/store/useSynthStore";
import pkg from "../../../package.json";
import { PRESET_SCHEMA_VERSION, type SynthPresetV1, type SynthPresetV1Assets } from "./types";

export type BuildPresetInput = {
  synth: SynthParams;
  layerEffects: LayerEffectsMap;
  imageResolution: { width: number; height: number };
  viewport: SynthPresetV1["viewport"];
  baseTimeSeconds: number;
  assets?: SynthPresetV1Assets;
};

// When assets are embedded the preset is self-contained; otherwise re-upload background/decal in the target app.

export function buildPreset(input: BuildPresetInput): SynthPresetV1 {
  return {
    presetSchemaVersion: PRESET_SCHEMA_VERSION,
    engineVersion: pkg.version,
    synth: { ...input.synth },
    layerEffects: structuredClone(input.layerEffects),
    imageResolution: { ...input.imageResolution },
    viewport: { ...input.viewport },
    baseTimeSeconds: input.baseTimeSeconds,
    ...(input.assets && Object.keys(input.assets).length > 0 ? { assets: input.assets } : {}),
  };
}

export function presetToJson(preset: SynthPresetV1, pretty = true): string {
  return JSON.stringify(preset, null, pretty ? 2 : undefined);
}
