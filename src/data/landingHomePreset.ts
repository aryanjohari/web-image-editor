import pkg from "../../package.json";
import { PRESET_SCHEMA_VERSION } from "@/lib/preset/types";
import type { SynthPresetViewport, SynthPresetV2 } from "@/lib/preset/types";
import {
  createDefaultLayerEffectsMap,
  type LayerEffectParams,
  type LayerEffectsMap,
  type LayerId,
} from "@/store/layerEffects";
import { createTextLayer } from "@/store/textLayers";

/** Matches public/demo/hero.jpg (1920×1080 landscape placeholder). */
const HERO_IMAGE_RESOLUTION = { width: 1920, height: 1080 } as const;

const LANDING_VIEWPORT: SynthPresetViewport = {
  drawBufferWidth: 1920,
  drawBufferHeight: 1080,
  cssWidth: 960,
  cssHeight: 540,
  dpr: 2,
};

function mergeLayerEffects(patch: Partial<Record<LayerId, Partial<LayerEffectParams>>>): LayerEffectsMap {
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

const titleLayer = createTextLayer({
  id: "landing-hero-title",
  text: "BACKGROUND\nSTUDIO",
  color: "#e8f4ff",
  fontSize: 118,
  offsetX: -0.28,
  offsetY: 0.18,
  scale: 1.02,
  effectsLinked: true,
});

const taglineLayer = createTextLayer({
  id: "landing-hero-tagline",
  text: "PRESET JSON FOR THE WEB",
  color: "#6ec8ff",
  fontSize: 52,
  offsetX: -0.28,
  offsetY: -0.06,
  scale: 0.98,
  effectsLinked: true,
});

/** Landing `/` hero look — motion + grade, no embedded assets. */
export const LANDING_HOME_PRESET: SynthPresetV2 = {
  presetSchemaVersion: PRESET_SCHEMA_VERSION,
  engineVersion: pkg.version,
  synth: {
    decalScale: 1,
    decalOffsetX: 0,
    decalOffsetY: 0,
    decalBackgroundLumaMask: 0,
    linkDecalToMath: false,
    linkTextToMath: true,
    textLayers: [taglineLayer, titleLayer],
    selectedTextLayerId: titleLayer.id,
    textLayerEffects: {},
  },
  layerEffects: mergeLayerEffects({
    background: {
      meltIntensity: 0.16,
      colorBleed: 0.48,
      noiseLevel: 0.05,
      posterizeSteps: 10,
      timeScale: 0.72,
      maskCenterX: 0.42,
      maskCenterY: 0.55,
      maskRadius: 0.62,
      twirlIntensity: 0.08,
      colorA: "#050a14",
      colorB: "#1a6bff",
      duotoneBlend: 0.48,
      colorCycleSpeed: 0.08,
      halftoneIntensity: 0.08,
      scanlineIntensity: 0.05,
    },
    text: {
      meltIntensity: 0.1,
      colorBleed: 0.38,
      noiseLevel: 0.02,
      posterizeSteps: 12,
      timeScale: 0.95,
      duotoneBlend: 0,
      scanlineIntensity: 0.06,
      halftoneIntensity: 0.04,
    },
  }),
  imageResolution: { ...HERO_IMAGE_RESOLUTION },
  viewport: { ...LANDING_VIEWPORT },
  baseTimeSeconds: 0,
};
