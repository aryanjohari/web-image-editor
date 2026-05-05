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

const DEMO_VIEWPORT: SynthPresetViewport = {
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

function makeIdeaPreset(
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

/** High-contrast duotone bleed, linked motion — noir / acid flyer look. */
export const IDEA_ACID_NOIR = makeIdeaPreset(
  {
    decalScale: 1,
    decalOffsetX: -0.04,
    decalOffsetY: 0.02,
    decalBackgroundLumaMask: 0.15,
    linkDecalToMath: true,
    linkTextToMath: true,
    textLayers: [
      createTextLayer({
        id: "preset-idea-acid-noir",
        text: "ACID NOIR",
        color: "#c8ff00",
        fontSize: 140,
        offsetX: 0.06,
        offsetY: -0.02,
        scale: 1.05,
        effectsLinked: true,
      }),
    ],
    selectedTextLayerId: "preset-idea-acid-noir",
    textLayerEffects: {},
  },
  {
    background: {
      meltIntensity: 0.38,
      colorBleed: 0.78,
      noiseLevel: 0.06,
      posterizeSteps: 12,
      timeScale: 1.55,
      colorA: "#120028",
      colorB: "#00ffc8",
      duotoneBlend: 0.62,
      colorCycleSpeed: 0.42,
      scanlineIntensity: 0.12,
    },
    decal: {
      meltIntensity: 0.22,
      colorBleed: 0.42,
      twirlIntensity: 0.12,
      timeScale: 1.85,
      halftoneIntensity: 0.25,
    },
    text: {
      meltIntensity: 0.12,
      colorBleed: 0.52,
      duotoneBlend: 0,
      posterizeSteps: 10,
    },
  },
);

/** Raster tear + scanlines, aggressive noise. */
export const IDEA_GLITCH = makeIdeaPreset(
  {
    decalScale: 1.08,
    decalOffsetX: 0,
    decalOffsetY: 0,
    decalBackgroundLumaMask: 0,
    linkDecalToMath: true,
    linkTextToMath: false,
    textLayers: [
      createTextLayer({
        id: "preset-idea-glitch",
        text: "GLITCH CORE",
        color: "#ff2a6d",
        fontSize: 110,
        offsetX: -0.02,
        offsetY: 0.04,
        scale: 1.2,
        effectsLinked: true,
      }),
    ],
    selectedTextLayerId: "preset-idea-glitch",
    textLayerEffects: {},
  },
  {
    background: {
      meltIntensity: 0.72,
      colorBleed: 0.94,
      noiseLevel: 0.22,
      posterizeSteps: 5,
      timeScale: 2.4,
      maskRadius: 0.58,
      twirlIntensity: 0,
      halftoneIntensity: 0.15,
      scanlineIntensity: 0.52,
      colorCycleSpeed: 2.8,
      colorA: "#000814",
      colorB: "#00f5ff",
      duotoneBlend: 0.35,
    },
    decal: {
      meltIntensity: 0.45,
      colorBleed: 0.55,
      noiseLevel: 0.18,
      timeScale: 2.9,
      scanlineIntensity: 0.38,
      posterizeSteps: 4,
    },
    text: {
      meltIntensity: 0.25,
      colorBleed: 0.7,
      scanlineIntensity: 0.22,
      timeScale: 1.9,
      noiseLevel: 0.1,
    },
  },
);

/** Halftone + slow posterization; calmer archival print tone. */
export const IDEA_ARCHIVE = makeIdeaPreset(
  {
    decalScale: 0.92,
    decalOffsetX: 0.02,
    decalOffsetY: -0.03,
    decalBackgroundLumaMask: 0.35,
    linkDecalToMath: false,
    linkTextToMath: false,
    textLayers: [
      createTextLayer({
        id: "preset-idea-archive",
        text: "ARCHIVE\nOFFSET",
        color: "#e8dfd2",
        fontSize: 88,
        offsetX: 0,
        offsetY: -0.04,
        scale: 0.95,
        effectsLinked: true,
      }),
    ],
    selectedTextLayerId: "preset-idea-archive",
    textLayerEffects: {},
  },
  {
    background: {
      meltIntensity: 0.06,
      colorBleed: 0.08,
      noiseLevel: 0.02,
      posterizeSteps: 6,
      timeScale: 0.42,
      maskCenterX: 0.52,
      maskCenterY: 0.48,
      halftoneIntensity: 0.55,
      duotoneBlend: 0,
      scanlineIntensity: 0,
      colorA: "#1a1612",
      colorB: "#f7efe3",
      colorCycleSpeed: 0,
    },
    decal: {
      meltIntensity: 0.03,
      colorBleed: 0.06,
      halftoneIntensity: 0.35,
      posterizeSteps: 8,
      timeScale: 0.35,
      maskRadius: 0.72,
      duotoneBlend: 0,
    },
    text: {
      meltIntensity: 0,
      posterizeSteps: 6,
      halftoneIntensity: 0.18,
      colorBleed: 0.08,
      timeScale: 0.55,
      scanlineIntensity: 0,
    },
  },
);
