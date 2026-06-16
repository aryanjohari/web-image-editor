import type { LayerEffectParams } from "@/store/layerEffects";

export type FormulaLayerTarget = "background" | "decal" | "text";

export type FormulaCategory = "warp" | "shade" | "composite";

export type FormulaEntry = {
  id: string;
  label: string;
  category: FormulaCategory;
  plainEnglish: string;
  equation: string;
  shaderRef: string;
  layer: FormulaLayerTarget;
  param: keyof LayerEffectParams;
  min: number;
  max: number;
  step?: number;
};

export const FORMULA_CATALOG: FormulaEntry[] = [
  {
    id: "melt",
    label: "Melt (UV warp)",
    category: "warp",
    plainEnglish: "Ripples UV coordinates before sampling so the image appears to melt and flow.",
    equation: "uv' = uv + sin(uv·k + t) × strength",
    shaderRef: "spaceDistortionFor in fragment.glsl",
    layer: "background",
    param: "meltIntensity",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "twirl",
    label: "Twirl (rotation warp)",
    category: "warp",
    plainEnglish: "Rotates UVs around a mask center, stronger toward the middle of the frame.",
    equation: "uv' = R(θ)·(uv − center) + center",
    shaderRef: "applyTwirl, layerWarp in fragment.glsl",
    layer: "background",
    param: "twirlIntensity",
    min: -20,
    max: 20,
    step: 0.01,
  },
  {
    id: "bleed",
    label: "Color bleed",
    category: "shade",
    plainEnglish: "Cross-mixes RGB channels so colors smear into each other like misregistered print.",
    equation: "rgb' = M_bleed · rgb",
    shaderRef: "colorMutationFor in fragment.glsl",
    layer: "background",
    param: "colorBleed",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "posterize",
    label: "Posterize",
    category: "shade",
    plainEnglish: "Snaps each color channel to a small number of levels for a crushed, graphic look.",
    equation: "rgb' = floor(rgb · steps) / steps",
    shaderRef: "colorMutationFor in fragment.glsl",
    layer: "decal",
    param: "posterizeSteps",
    min: 2,
    max: 24,
    step: 1,
  },
  {
    id: "duotone",
    label: "Duotone blend",
    category: "shade",
    plainEnglish: "Maps luminance between two colors and mixes back toward the original.",
    equation: "rgb' = mix(rgb, mix(cA, cB, luma), blend)",
    shaderRef: "applyDuotoneFor in fragment.glsl",
    layer: "decal",
    param: "duotoneBlend",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "halftone",
    label: "Halftone dots",
    category: "shade",
    plainEnglish: "Overlays a dot screen derived from image brightness, like newsprint.",
    equation: "rgb' = mix(rgb, dotGrid(uv, res), intensity)",
    shaderRef: "applyHalftoneFor in fragment.glsl",
    layer: "decal",
    param: "halftoneIntensity",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "scanlines",
    label: "Scanlines",
    category: "composite",
    plainEnglish: "Darkens horizontal bands over the shaded color, like a CRT or VHS screen.",
    equation: "rgb' = mix(rgb, rgb × sin(y), intensity)",
    shaderRef: "applyScanlinesFor in fragment.glsl",
    layer: "text",
    param: "scanlineIntensity",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "noise",
    label: "Procedural noise",
    category: "shade",
    plainEnglish: "Adds hash-based grain on top of the sampled color after warp.",
    equation: "rgb' = rgb + hash(uv, t) × level",
    shaderRef: "proceduralNoiseFor in fragment.glsl",
    layer: "text",
    param: "noiseLevel",
    min: 0,
    max: 0.5,
    step: 0.01,
  },
  {
    id: "timeScale",
    label: "Time scale",
    category: "warp",
    plainEnglish: "Scales animation speed for melt, duotone LFO, and other time-driven effects on this layer.",
    equation: "t_layer = baseTime × timeScale",
    shaderRef: "SynthMaterial.tsx (u_*_t uniforms)",
    layer: "background",
    param: "timeScale",
    min: 0,
    max: 3,
    step: 0.01,
  },
  {
    id: "maskRadius",
    label: "Twirl mask radius",
    category: "warp",
    plainEnglish: "Controls how far from the mask center the twirl warp fades in.",
    equation: "warp × smoothstep(radius, edge, dist)",
    shaderRef: "applyTwirl, layerWarp in fragment.glsl",
    layer: "background",
    param: "maskRadius",
    min: 0,
    max: 1,
    step: 0.01,
  },
];

export function getFormulaById(id: string): FormulaEntry | undefined {
  return FORMULA_CATALOG.find((entry) => entry.id === id);
}

export function getFormulasForLayer(layer: FormulaLayerTarget): FormulaEntry[] {
  return FORMULA_CATALOG.filter((entry) => entry.layer === layer);
}
