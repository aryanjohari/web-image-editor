import type { LayerEffectParams, LayerEffectsMap } from "@/store/layerEffects";
import type { TextLayer } from "@/store/textLayers";
import type { SynthParams } from "@/store/useSynthStore";

/** Legacy preset files (single text string + global styling). */
export const PRESET_SCHEMA_VERSION_V1 = 1 as const;

/** Current preset file format; bump when breaking JSON shape. */
export const PRESET_SCHEMA_VERSION = 2 as const;

export type EmbeddedImageAsset = {
  mime: string;
  dataBase64: string;
};

export type SynthPresetV1Assets = {
  background?: EmbeddedImageAsset;
  decal?: EmbeddedImageAsset;
};

export type SynthPresetViewport = {
  drawBufferWidth: number;
  drawBufferHeight: number;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
};

/** v1 `synth` block (before multi text layers). */
export type LegacySynthParamsV1 = {
  overlayText: string;
  textColor: string;
  textSize: number;
  decalScale: number;
  decalOffsetX: number;
  decalOffsetY: number;
  linkDecalToMath: boolean;
  textOffsetX: number;
  textOffsetY: number;
  textScale: number;
  linkTextToMath: boolean;
};

export type SynthPresetV1 = {
  presetSchemaVersion: typeof PRESET_SCHEMA_VERSION_V1;
  engineVersion: string;
  synth: LegacySynthParamsV1;
  layerEffects: LayerEffectsMap;
  imageResolution: { width: number; height: number };
  viewport: SynthPresetViewport;
  baseTimeSeconds: number;
  assets?: SynthPresetV1Assets;
};

export type SynthPresetV2Synth = SynthParams & {
  textLayers: TextLayer[];
  selectedTextLayerId: string;
  textLayerEffects: Record<string, LayerEffectParams>;
};

export type SynthPresetV2 = {
  presetSchemaVersion: typeof PRESET_SCHEMA_VERSION;
  engineVersion: string;
  synth: SynthPresetV2Synth;
  layerEffects: LayerEffectsMap;
  imageResolution: { width: number; height: number };
  viewport: SynthPresetViewport;
  baseTimeSeconds: number;
  assets?: SynthPresetV1Assets;
};

export type SynthPresetAny = SynthPresetV1 | SynthPresetV2;
