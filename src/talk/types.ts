/** Talk request/response types (M03 §3; M05 regional extension). */

import type { PackId } from "../packs/types";
import type { RegionalPresetId, RegionalRegion, RegionalSliderId } from "../packs/regionalSliders";
import type { SemanticSliderId } from "../packs/sliders";

export type TalkErrorCode =
  | "OFFLINE"
  | "TIMEOUT"
  | "HTTP_400"
  | "HTTP_401"
  | "HTTP_429"
  | "HTTP_500"
  | "HTTP_502"
  | "HTTP_503"
  | "SCHEMA"
  | "UNKNOWN_PACK"
  | "UNKNOWN_SLIDER"
  | "ALLOWLIST"
  | "OOR"
  | "VALIDATE"
  | "REFUSE_GENERATIVE"
  | "MISSING_KEY"
  | "RATE_LIMIT"
  | "NO_MASK";

export type RecipeContextSliders = {
  exposure: number;
  contrast: number;
  warmth: number;
  chroma: number;
  fade: number;
  grain: number;
  vignette: number;
  duotone?: number;
};

export type RecipeContextRegionalSliders = {
  bg_mute: number;
  bg_fade: number;
  subject_pop: number;
  subject_chroma: number;
};

export type RecipeContext = {
  packId: string | null;
  packVersion: string | null;
  sliders: RecipeContextSliders;
  mainEffectIds?: string[];
  /** True when main.maskRef is present (Tier B). */
  hasMask?: boolean;
  regionalSliders?: RecipeContextRegionalSliders;
};

export type TalkRequest = {
  text: string;
  recipeContext: RecipeContext;
};

export type TalkApplyPack = {
  packId: PackId;
  intensity?: number;
};

export type TalkSetSlider = {
  op: "set_slider";
  sliderId: SemanticSliderId;
  value: number;
};

export type TalkDeltaSlider = {
  op: "delta_slider";
  sliderId: SemanticSliderId;
  /** Relative delta; if omitted, normalizer fills default Δ. */
  delta?: number;
};

export type TalkSetRegionalSlider = {
  op: "set_regional_slider";
  region: RegionalRegion;
  sliderId: RegionalSliderId;
  value: number;
};

export type TalkDeltaRegionalSlider = {
  op: "delta_regional_slider";
  region: RegionalRegion;
  sliderId: RegionalSliderId;
  delta?: number;
};

export type TalkApplyRegionalPreset = {
  presetId: RegionalPresetId;
};

export type TalkPatch =
  | TalkSetSlider
  | TalkDeltaSlider
  | TalkSetRegionalSlider
  | TalkDeltaRegionalSlider;

export type TalkRefuse = {
  code: string;
  reason: string;
};

export type TalkResponse = {
  applyPack?: TalkApplyPack;
  patches?: TalkPatch[];
  applyRegionalPreset?: TalkApplyRegionalPreset;
  /** Host action: Lab runs client mask worker; not a recipe field. */
  regenerateMask?: boolean;
  say?: string;
  refuse?: TalkRefuse;
};

export type TalkApiError = {
  error: {
    code: TalkErrorCode | string;
    message: string;
  };
};

export const TALK_PACK_IDS = [
  "editorial-bw",
  "warm-film",
  "poster-punch",
] as const satisfies readonly PackId[];

export const TALK_SLIDER_IDS = [
  "exposure",
  "contrast",
  "warmth",
  "chroma",
  "fade",
  "grain",
  "vignette",
  "duotone",
] as const satisfies readonly SemanticSliderId[];

export const TALK_REGIONAL_SLIDER_IDS = [
  "bg_mute",
  "bg_fade",
  "subject_pop",
  "subject_chroma",
] as const satisfies readonly RegionalSliderId[];

export const TALK_REGIONAL_REGIONS = ["subject", "background"] as const satisfies readonly RegionalRegion[];

export const TALK_REGIONAL_PRESET_IDS = [
  "muted_background",
  "subject_pop",
] as const satisfies readonly RegionalPresetId[];

/** Fraction of slider span when model omits delta magnitude. */
export const DEFAULT_DELTA_FRACTION = 0.1;

export const TALK_CLIENT_TIMEOUT_MS = 12_000;
