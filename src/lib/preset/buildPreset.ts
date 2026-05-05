import type { LayerEffectParams, LayerEffectsMap } from "@/store/layerEffects";
import type { TextLayer } from "@/store/textLayers";
import type { SynthParams } from "@/store/useSynthStore";
import pkg from "../../../package.json";
import {
  PRESET_SCHEMA_VERSION,
  type SynthPresetV1Assets,
  type SynthPresetV2,
  type SynthPresetViewport,
} from "./types";

export type BuildPresetInput = {
  synth: SynthParams & {
    textLayers: TextLayer[];
    selectedTextLayerId: string;
    textLayerEffects: Record<string, LayerEffectParams>;
  };
  layerEffects: LayerEffectsMap;
  imageResolution: { width: number; height: number };
  viewport: SynthPresetViewport;
  baseTimeSeconds: number;
  assets?: SynthPresetV1Assets;
};

export function buildPreset(input: BuildPresetInput): SynthPresetV2 {
  return {
    presetSchemaVersion: PRESET_SCHEMA_VERSION,
    engineVersion: pkg.version,
    synth: {
      decalScale: input.synth.decalScale,
      decalOffsetX: input.synth.decalOffsetX,
      decalOffsetY: input.synth.decalOffsetY,
      decalBackgroundLumaMask: input.synth.decalBackgroundLumaMask,
      linkDecalToMath: input.synth.linkDecalToMath,
      linkTextToMath: input.synth.linkTextToMath,
      textLayers: structuredClone(input.synth.textLayers),
      selectedTextLayerId: input.synth.selectedTextLayerId,
      textLayerEffects: structuredClone(input.synth.textLayerEffects),
    },
    layerEffects: structuredClone(input.layerEffects),
    imageResolution: { ...input.imageResolution },
    viewport: { ...input.viewport },
    baseTimeSeconds: input.baseTimeSeconds,
    ...(input.assets && Object.keys(input.assets).length > 0 ? { assets: input.assets } : {}),
  };
}

export function presetToJson(preset: SynthPresetV2, pretty = true): string {
  return JSON.stringify(preset, null, pretty ? 2 : undefined);
}
