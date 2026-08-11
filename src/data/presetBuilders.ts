import pkg from "../../package.json";
import { PRESET_SCHEMA_VERSION } from "../lib/preset/types";
import type { SynthPresetViewport, SynthPresetV2 } from "../lib/preset/types";
import {
  createDefaultLayerEffectsMap,
  type LayerEffectParams,
  type LayerEffectsMap,
  type LayerId,
} from "../store/layerEffects";

export const DEMO_VIEWPORT: SynthPresetViewport = {
  drawBufferWidth: 1920,
  drawBufferHeight: 1080,
  cssWidth: 960,
  cssHeight: 540,
  dpr: 2,
};

export function mergeLayerEffects(
  patch: Partial<Record<LayerId, Partial<LayerEffectParams>>>,
): LayerEffectsMap {
  const defaults = createDefaultLayerEffectsMap();
  return {
    background: {
      ...defaults.background,
      ...(patch.background ?? {}),
    },
    decal: {
      ...defaults.decal,
      ...(patch.decal ?? {}),
    },
    text: {
      ...defaults.text,
      ...(patch.text ?? {}),
    },
  };
}

export function makeIdeaPreset(
  synthPatch: SynthPresetV2["synth"],
  layerPatches: Partial<Record<LayerId, Partial<LayerEffectParams>>>,
): SynthPresetV2 {
  return {
    presetSchemaVersion: PRESET_SCHEMA_VERSION,
    engineVersion: pkg.version,
    synth: structuredClone(synthPatch),
    layerEffects: mergeLayerEffects(layerPatches),
    imageResolution: { width: 1920, height: 1080 },
    viewport: { ...DEMO_VIEWPORT },
    baseTimeSeconds: 0,
  };
}
