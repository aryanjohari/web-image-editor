/** Visual-effect bundle applied independently to background, decal, and text in the fragment shader. */
export type LayerId = "background" | "decal" | "text";

export type LayerEffectParams = {
  meltIntensity: number;
  colorBleed: number;
  noiseLevel: number;
  posterizeSteps: number;
  timeScale: number;
  maskCenterX: number;
  maskCenterY: number;
  maskRadius: number;
  twirlIntensity: number;
  colorA: string;
  colorB: string;
  duotoneBlend: number;
  colorCycleSpeed: number;
  halftoneIntensity: number;
  scanlineIntensity: number;
};

export type LayerEffectsMap = Record<LayerId, LayerEffectParams>;

export const LAYER_IDS: LayerId[] = ["background", "decal", "text"];

export function createDefaultLayerEffects(): LayerEffectParams {
  return {
    meltIntensity: 0.15,
    colorBleed: 0.2,
    noiseLevel: 0.04,
    posterizeSteps: 8,
    timeScale: 1.0,
    maskCenterX: 0.5,
    maskCenterY: 0.5,
    maskRadius: 0.5,
    twirlIntensity: 0.0,
    colorA: "#000000",
    colorB: "#ffffff",
    duotoneBlend: 0.0,
    colorCycleSpeed: 0,
    halftoneIntensity: 0,
    scanlineIntensity: 0,
  };
}

export function createDefaultLayerEffectsMap(): LayerEffectsMap {
  return {
    background: createDefaultLayerEffects(),
    decal: createDefaultLayerEffects(),
    text: createDefaultLayerEffects(),
  };
}
