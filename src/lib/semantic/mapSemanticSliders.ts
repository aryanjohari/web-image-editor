import type { PresetPatch } from "@/lib/preset/apply";

/**
 * Maps 0–1 semantic knobs to background-layer effect params (linear interpolation, clamped).
 *
 * Intensity: meltIntensity 0→0.75, colorBleed 0→0.85, duotoneBlend 0→0.65
 * Motion:    timeScale 0.25→2.5, colorCycleSpeed 0→2.8
 * Grit:      noiseLevel 0→0.22, scanlineIntensity 0→0.45, halftoneIntensity 0→0.35,
 *            posterizeSteps 16→4 (fewer steps = grittier)
 */
export type SemanticSliderValues = {
  intensity: number;
  motion: number;
  grit: number;
};

export const DEFAULT_SEMANTIC: SemanticSliderValues = {
  intensity: 0.35,
  motion: 0.4,
  grit: 0.2,
};

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Maps 0–1 semantic knobs to a background-layer PresetPatch. */
export function semanticSlidersToPatch(values: SemanticSliderValues): PresetPatch {
  const intensity = clamp(values.intensity);
  const motion = clamp(values.motion);
  const grit = clamp(values.grit);

  return {
    layerEffects: {
      background: {
        meltIntensity: lerp(0, 0.75, intensity),
        colorBleed: lerp(0, 0.85, intensity),
        duotoneBlend: lerp(0, 0.65, intensity),
        timeScale: lerp(0.25, 2.5, motion),
        colorCycleSpeed: lerp(0, 2.8, motion),
        noiseLevel: lerp(0, 0.22, grit),
        scanlineIntensity: lerp(0, 0.45, grit),
        halftoneIntensity: lerp(0, 0.35, grit),
        posterizeSteps: lerp(16, 4, grit),
      },
    },
  };
}
