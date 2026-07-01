import { createTextLayer } from "@/store/textLayers";
import { makeIdeaPreset } from "@/data/presetBuilders";

const ambientSynthBase = {
  decalScale: 1,
  decalOffsetX: 0,
  decalOffsetY: 0,
  decalBackgroundLumaMask: 0,
  linkDecalToMath: false,
  linkTextToMath: false,
  textLayerEffects: {} as Record<string, never>,
};

function emptyPreviewLayer(id: string) {
  return createTextLayer({
    id,
    text: "",
    color: "#e8e8e8",
    fontSize: 48,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    effectsLinked: true,
  });
}

/** Slow floating drift — soft blue-gray ambient hero background. */
export const BG_SOFT_DRIFT = makeIdeaPreset(
  {
    ...ambientSynthBase,
    textLayers: [emptyPreviewLayer("preset-bg-soft-drift")],
    selectedTextLayerId: "preset-bg-soft-drift",
  },
  {
    background: {
      meltIntensity: 0.12,
      colorBleed: 0.32,
      noiseLevel: 0.02,
      posterizeSteps: 12,
      timeScale: 0.5,
      twirlIntensity: 0.05,
      colorA: "#1a2030",
      colorB: "#8a9cb8",
      duotoneBlend: 0.55,
      colorCycleSpeed: 0.04,
      scanlineIntensity: 0,
      halftoneIntensity: 0,
    },
    decal: {
      meltIntensity: 0.04,
      colorBleed: 0.12,
      timeScale: 0.45,
    },
    text: {
      meltIntensity: 0,
      colorBleed: 0.1,
      timeScale: 0.4,
    },
  },
);

/** Subtle film grain texture — cinematic analog feel. */
export const BG_FILM_GRAIN = makeIdeaPreset(
  {
    ...ambientSynthBase,
    textLayers: [emptyPreviewLayer("preset-bg-film-grain")],
    selectedTextLayerId: "preset-bg-film-grain",
  },
  {
    background: {
      meltIntensity: 0.08,
      colorBleed: 0.2,
      noiseLevel: 0.14,
      posterizeSteps: 10,
      timeScale: 0.58,
      halftoneIntensity: 0.12,
      scanlineIntensity: 0.06,
      colorA: "#141210",
      colorB: "#c8c0b8",
      duotoneBlend: 0.35,
      colorCycleSpeed: 0,
    },
    decal: {
      meltIntensity: 0.03,
      colorBleed: 0.1,
      noiseLevel: 0.08,
      timeScale: 0.5,
    },
    text: {
      meltIntensity: 0,
      colorBleed: 0.08,
      noiseLevel: 0.04,
      timeScale: 0.5,
    },
  },
);

/** Deep navy dusk gradient — dark cinematic hero background. */
export const BG_NIGHT_GRADIENT = makeIdeaPreset(
  {
    ...ambientSynthBase,
    textLayers: [emptyPreviewLayer("preset-bg-night-gradient")],
    selectedTextLayerId: "preset-bg-night-gradient",
  },
  {
    background: {
      meltIntensity: 0.06,
      colorBleed: 0.28,
      noiseLevel: 0.02,
      posterizeSteps: 11,
      timeScale: 0.7,
      colorA: "#050508",
      colorB: "#1e1a3a",
      duotoneBlend: 0.62,
      colorCycleSpeed: 0,
      scanlineIntensity: 0,
      halftoneIntensity: 0,
      twirlIntensity: 0.02,
    },
    decal: {
      meltIntensity: 0.02,
      colorBleed: 0.12,
      timeScale: 0.65,
    },
    text: {
      meltIntensity: 0,
      colorBleed: 0.12,
      timeScale: 0.6,
    },
  },
);

/** Minimal seamless loop — clean subtle motion for landing sections. */
export const BG_CLEAN_LOOP = makeIdeaPreset(
  {
    ...ambientSynthBase,
    textLayers: [emptyPreviewLayer("preset-bg-clean-loop")],
    selectedTextLayerId: "preset-bg-clean-loop",
  },
  {
    background: {
      meltIntensity: 0.04,
      colorBleed: 0.18,
      noiseLevel: 0.01,
      posterizeSteps: 12,
      timeScale: 0.85,
      colorA: "#0c1018",
      colorB: "#3a4a5a",
      duotoneBlend: 0.42,
      colorCycleSpeed: 0,
      scanlineIntensity: 0,
      halftoneIntensity: 0,
    },
    decal: {
      meltIntensity: 0.02,
      colorBleed: 0.08,
      timeScale: 0.8,
    },
    text: {
      meltIntensity: 0,
      colorBleed: 0.06,
      timeScale: 0.75,
    },
  },
);
