/** Talk request/response types (M03 §3; M05 regional; M06 craft). */

import type { PackId } from "../packs/types";
import type { RegionalPresetId, RegionalRegion, RegionalSliderId } from "../packs/regionalSliders";
import type { SemanticSliderId } from "../packs/sliders";
import type { TextPositionHint, TypePresetId } from "../packs/types";

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
  grain_size?: number;
  vignette: number;
  blur?: number;
  duotone?: number;
};

export type RecipeContextRegionalSliders = {
  bg_mute: number;
  bg_fade: number;
  bg_blur: number;
  subject_pop: number;
  subject_chroma: number;
};

export type RecipeContextTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

export type RecipeContextSelection = "text" | "overlay" | "none";

export type RecipeContext = {
  packId: string | null;
  packVersion: string | null;
  sliders: RecipeContextSliders;
  mainEffectIds?: string[];
  /** True when main.maskRef is present (Tier B). */
  hasMask?: boolean;
  regionalSliders?: RecipeContextRegionalSliders;
  /** M07 canvas context (no Blobs / AssetRefs). */
  hasOverlay?: boolean;
  hasText?: boolean;
  /** Truncated text content for talk. */
  textContent?: string;
  textTransform?: RecipeContextTransform;
  overlayTransform?: RecipeContextTransform;
  selection?: RecipeContextSelection;
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

export type TalkSetTextHint = {
  position?: TextPositionHint;
  typePreset?: TypePresetId;
};

export type TalkTransformTarget = "text" | "overlay";

export type TalkSetTextContent = {
  content: string;
};

export type TalkNudgeTransform = {
  target: TalkTransformTarget;
  dx?: number;
  dy?: number;
  dScale?: number;
};

export type TalkSetTransform = {
  target: TalkTransformTarget;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
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
  setTextHint?: TalkSetTextHint;
  setTextContent?: TalkSetTextContent;
  /** Absolute transform write (normalize folds nudge → set). */
  setTransform?: TalkSetTransform;
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
  "warm-film",
  "dusk-grain",
  "flash-raw",
  "cool-chrome",
  "editorial-bw",
  "clean-editorial",
  "muted-split",
  "poster-punch",
] as const satisfies readonly PackId[];

export const TALK_SLIDER_IDS = [
  "exposure",
  "contrast",
  "warmth",
  "chroma",
  "fade",
  "grain",
  "grain_size",
  "vignette",
  "blur",
  "duotone",
] as const satisfies readonly SemanticSliderId[];

export const TALK_REGIONAL_SLIDER_IDS = [
  "bg_mute",
  "bg_fade",
  "bg_blur",
  "subject_pop",
  "subject_chroma",
] as const satisfies readonly RegionalSliderId[];

export const TALK_REGIONAL_REGIONS = ["subject", "background"] as const satisfies readonly RegionalRegion[];

export const TALK_REGIONAL_PRESET_IDS = [
  "muted_background",
  "subject_pop",
] as const satisfies readonly RegionalPresetId[];

export const TALK_TEXT_POSITIONS = [
  "top-band",
  "bottom-left",
  "center",
] as const satisfies readonly TextPositionHint[];

export const TALK_TYPE_PRESETS = [
  "sans-bold",
  "condensed",
] as const satisfies readonly TypePresetId[];

export const TALK_TRANSFORM_TARGETS = [
  "text",
  "overlay",
] as const satisfies readonly TalkTransformTarget[];

/** Fraction of slider span when model omits delta magnitude. */
export const DEFAULT_DELTA_FRACTION = 0.1;

/** Default NDC nudge when model omits dx/dy magnitude ("up a bit"). */
export const DEFAULT_TRANSFORM_NUDGE_XY = 0.08;

/** Default uniform scale nudge when model omits dScale ("bigger"). */
export const DEFAULT_TRANSFORM_NUDGE_SCALE = 0.1;

export const TALK_CLIENT_TIMEOUT_MS = 12_000;
