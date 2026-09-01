import { TIER_A_EFFECTS } from "../recipe/effectsRegistry";
import { applyPathPatch } from "../recipe/pathPatch";
import type { Effect, PathPatch, Recipe, RegionalGrade } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { defaultEffectParams } from "./sliders";

export type RegionalRegion = "subject" | "background";

export type RegionalSliderId =
  | "bg_mute"
  | "bg_fade"
  | "bg_blur"
  | "subject_pop"
  | "subject_chroma";

export type RegionalSliderSpec = {
  id: RegionalSliderId;
  label: string;
  region: RegionalRegion;
  effectId: string;
  paramKey: string;
  min: number;
  max: number;
  step: number;
};

function clampRegionalValue(spec: RegionalSliderSpec, value: number): number {
  return Math.min(spec.max, Math.max(spec.min, value));
}

/** Tier B regional semantic axes (M05 §2.D + M06 bg_blur). */
export const REGIONAL_SLIDERS: readonly RegionalSliderSpec[] = [
  {
    id: "bg_mute",
    label: "Background mute",
    region: "background",
    effectId: "saturation",
    paramKey: "amount",
    min: -1,
    max: 1,
    step: 0.01,
  },
  {
    id: "bg_fade",
    label: "Background fade",
    region: "background",
    effectId: "fade",
    paramKey: "amount",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "bg_blur",
    label: "Background blur",
    region: "background",
    effectId: "blur",
    paramKey: "amount",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    id: "subject_pop",
    label: "Subject pop",
    region: "subject",
    effectId: "contrast",
    paramKey: "amount",
    min: -1,
    max: 1,
    step: 0.01,
  },
  {
    id: "subject_chroma",
    label: "Subject color",
    region: "subject",
    effectId: "saturation",
    paramKey: "amount",
    min: -1,
    max: 1,
    step: 0.01,
  },
] as const;

const DEFAULT_DELTA_FRACTION = 0.1;

export function emptyRegional(): RegionalGrade {
  return { subject: { effects: [] }, background: { effects: [] } };
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function mainImage(recipe: Recipe) {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") {
    throw new Error("ensureRegionalEffect: no main image object");
  }
  return main;
}

/**
 * Ensure main.regional[region] has effect `effectId`.
 * Requires maskRef + regional on main (validated after merge).
 */
export function ensureRegionalEffect(
  recipe: Recipe,
  region: RegionalRegion,
  effectId: string,
): { recipe: Recipe; index: number } {
  if (!(effectId in TIER_A_EFFECTS)) {
    throw new Error(`ensureRegionalEffect: unknown effect "${effectId}"`);
  }
  const candidate = deepClone(recipe);
  const main = candidate.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") {
    throw new Error("ensureRegionalEffect: no main image object");
  }
  if (!main.regional) {
    main.regional = emptyRegional();
  }
  const stack = main.regional[region].effects;
  let index = stack.findIndex((e) => e.id === effectId);
  if (index < 0) {
    stack.push({ id: effectId, params: defaultEffectParams(effectId) });
    index = stack.length - 1;
  }
  return { recipe: validateRecipe(candidate), index };
}

export function applyRegionalSlider(
  recipe: Recipe,
  sliderId: RegionalSliderId,
  value: number,
): Recipe {
  const spec = REGIONAL_SLIDERS.find((s) => s.id === sliderId);
  if (!spec) {
    throw new Error(`unknown regional slider "${sliderId}"`);
  }
  const { recipe: withEffect, index } = ensureRegionalEffect(
    recipe,
    spec.region,
    spec.effectId,
  );
  const clamped = clampRegionalValue(spec, value);
  const patch: PathPatch = [
    {
      path: `/objects/main/regional/${spec.region}/effects/${index}/params/${spec.paramKey}`,
      value: clamped,
    },
  ];
  return applyPathPatch(withEffect, patch);
}

export function readRegionalSliderValue(
  recipe: Recipe,
  sliderId: RegionalSliderId,
): number {
  const spec = REGIONAL_SLIDERS.find((s) => s.id === sliderId);
  if (!spec) return 0;
  const main = mainImage(recipe);
  const stack = main.regional?.[spec.region]?.effects;
  if (!stack) return 0;
  const ef = stack.find((e: Effect) => e.id === spec.effectId);
  if (!ef) return 0;
  const v = ef.params[spec.paramKey];
  return typeof v === "number" ? v : 0;
}

export function mainHasMask(recipe: Recipe): boolean {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  return !!(main && main.kind === "image" && main.maskRef);
}

export type RegionalPresetId = "muted_background" | "subject_pop";

/** Closed preset templates → regional slider values (M05 §6 talk). */
export const REGIONAL_PRESET_VALUES: Record<
  RegionalPresetId,
  Partial<Record<RegionalSliderId, number>>
> = {
  muted_background: { bg_mute: -0.85, bg_fade: 0.35 },
  subject_pop: { subject_pop: 0.4, subject_chroma: 0.15 },
};

export function applyRegionalPreset(recipe: Recipe, presetId: RegionalPresetId): Recipe {
  const values = REGIONAL_PRESET_VALUES[presetId];
  if (!values) {
    throw new Error(`unknown regional preset "${presetId}"`);
  }
  let next = recipe;
  for (const [sliderId, value] of Object.entries(values)) {
    next = applyRegionalSlider(next, sliderId as RegionalSliderId, value);
  }
  return next;
}

export function defaultDeltaForRegionalSlider(sliderId: RegionalSliderId): number {
  const spec = REGIONAL_SLIDERS.find((s) => s.id === sliderId);
  if (!spec) throw new Error(`unknown regional slider ${sliderId}`);
  return DEFAULT_DELTA_FRACTION * (spec.max - spec.min);
}

/** Regional axes listed on a pack (pack-first Lab). */
export function regionalSlidersForAxes(axes: string[]): RegionalSliderSpec[] {
  return REGIONAL_SLIDERS.filter((s) => axes.includes(s.id));
}

