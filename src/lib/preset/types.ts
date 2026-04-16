import type { LayerEffectsMap } from "@/store/layerEffects";
import type { SynthParams } from "@/store/useSynthStore";

/** Current preset file format; bump when breaking JSON shape. */
export const PRESET_SCHEMA_VERSION = 1 as const;

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

/**
 * Portable snapshot for matching WebGL + 2D text in another build.
 * Textures are omitted unless `assets` embeds them (see export module comment).
 */
export type SynthPresetV1 = {
  presetSchemaVersion: typeof PRESET_SCHEMA_VERSION;
  engineVersion: string;
  synth: SynthParams;
  layerEffects: LayerEffectsMap;
  imageResolution: { width: number; height: number };
  viewport: SynthPresetViewport;
  baseTimeSeconds: number;
  assets?: SynthPresetV1Assets;
};
