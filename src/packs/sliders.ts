import { TIER_A_EFFECTS } from "../recipe/effectsRegistry";
import { applyPathPatch } from "../recipe/pathPatch";
import type { Effect, PathPatch, Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";

export type SemanticSliderId =
  | "exposure"
  | "contrast"
  | "warmth"
  | "chroma"
  | "fade"
  | "grain"
  | "vignette"
  | "duotone";

export type SliderSpec = {
  id: SemanticSliderId;
  label: string;
  /** Registry effect id on main. */
  effectId: string;
  paramKey: string;
  min: number;
  max: number;
  step: number;
};

/** Tier A semantic slider set (M02 §5). */
export const SEMANTIC_SLIDERS: readonly SliderSpec[] = [
  {
    id: "exposure",
    label: "Exposure",
    effectId: "exposure",
    paramKey: "amount",
    min: -2,
    max: 2,
    step: 0.01,
  },
  {
    id: "contrast",
    label: "Contrast",
    effectId: "contrast",
    paramKey: "amount",
    min: -1,
    max: 1,
    step: 0.01,
  },
  {
    id: "warmth",
    label: "Warmth",
    effectId: "temperature",
    paramKey: "amount",
    min: -1,
    max: 1,
    step: 0.01,
  },
  {
    id: "chroma",
    label: "Chroma",
    effectId: "saturation",
    paramKey: "amount",
    min: -1,
    max: 1,
    step: 0.01,
  },
  {
    id: "fade",
    label: "Fade",
    effectId: "fade",
    paramKey: "amount",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "grain",
    label: "Grain",
    effectId: "grain",
    paramKey: "amount",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "vignette",
    label: "Vignette",
    effectId: "vignette",
    paramKey: "amount",
    min: 0,
    max: 1,
    step: 0.01,
  },
] as const;

export const DUOTONE_SLIDER: SliderSpec = {
  id: "duotone",
  label: "Duotone",
  effectId: "duotone",
  paramKey: "amount",
  min: 0,
  max: 1,
  step: 0.01,
};

/** Registry-default params for ensureEffect (identity amounts). */
export function defaultEffectParams(effectId: string): Effect["params"] {
  const spec = TIER_A_EFFECTS[effectId];
  if (!spec) {
    throw new Error(`unknown effect "${effectId}"`);
  }
  const params: Effect["params"] = {};
  for (const [key, pspec] of Object.entries(spec.params)) {
    if (pspec.type === "number") {
      params[key] = 0;
    } else if (pspec.type === "boolean") {
      params[key] = false;
    } else if (key === "shadow") {
      params[key] = "#1a1030";
    } else if (key === "highlight") {
      params[key] = "#f2e6c8";
    } else {
      params[key] = "";
    }
  }
  return params;
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Ensure main has effect `effectId`. Inserts at end with registry defaults if missing.
 * Returns validated recipe + index of the effect.
 */
export function ensureEffect(
  recipe: Recipe,
  effectId: string,
): { recipe: Recipe; index: number } {
  if (!(effectId in TIER_A_EFFECTS)) {
    throw new Error(`ensureEffect: unknown effect "${effectId}"`);
  }
  const candidate = deepClone(recipe);
  const mainIdx = candidate.objects.findIndex(
    (o) => o.kind === "image" && o.role === "main",
  );
  if (mainIdx < 0) {
    throw new Error("ensureEffect: no main image object");
  }
  const main = candidate.objects[mainIdx]!;
  if (main.kind !== "image") {
    throw new Error("ensureEffect: main is not image");
  }
  let index = main.effects.findIndex((e) => e.id === effectId);
  if (index < 0) {
    main.effects.push({ id: effectId, params: defaultEffectParams(effectId) });
    index = main.effects.length - 1;
  }
  return { recipe: validateRecipe(candidate), index };
}

export function clampSliderValue(spec: SliderSpec, value: number): number {
  return Math.min(spec.max, Math.max(spec.min, value));
}

/**
 * Set a semantic slider on main via PathPatch (M02 §5).
 * Clamps UI value pre-emit; validator still rejects OOR.
 */
export function applySemanticSlider(
  recipe: Recipe,
  sliderId: SemanticSliderId,
  value: number,
): Recipe {
  const spec =
    sliderId === "duotone"
      ? DUOTONE_SLIDER
      : SEMANTIC_SLIDERS.find((s) => s.id === sliderId);
  if (!spec) {
    throw new Error(`unknown slider "${sliderId}"`);
  }
  const { recipe: withEffect, index } = ensureEffect(recipe, spec.effectId);
  const clamped = clampSliderValue(spec, value);
  const patch: PathPatch = [
    {
      path: `/objects/main/effects/${index}/params/${spec.paramKey}`,
      value: clamped,
    },
  ];
  return applyPathPatch(withEffect, patch);
}

/** Read current numeric amount for a slider from main effects (or identity 0). */
export function readSliderValue(recipe: Recipe, sliderId: SemanticSliderId): number {
  const spec =
    sliderId === "duotone"
      ? DUOTONE_SLIDER
      : SEMANTIC_SLIDERS.find((s) => s.id === sliderId);
  if (!spec) return 0;
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") return 0;
  const ef = main.effects.find((e) => e.id === spec.effectId);
  if (!ef) return 0;
  const v = ef.params[spec.paramKey];
  return typeof v === "number" ? v : 0;
}

export function mainHasDuotone(recipe: Recipe): boolean {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") return false;
  return main.effects.some((e) => e.id === "duotone");
}
