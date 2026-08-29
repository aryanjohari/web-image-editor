/**
 * Pure TalkResponse normalizer (M03 §4–5; M05 regional).
 * Delta → absolute clamp via SEMANTIC_SLIDERS / REGIONAL_SLIDERS.
 * Unknown pack/slider → fail closed. refuse → pass through (no write later).
 */

import {
  defaultDeltaForRegionalSlider,
  REGIONAL_SLIDERS,
  type RegionalPresetId,
  type RegionalRegion,
  type RegionalSliderId,
} from "../packs/regionalSliders";
import {
  clampSliderValue,
  DUOTONE_SLIDER,
  SEMANTIC_SLIDERS,
  type SemanticSliderId,
  type SliderSpec,
} from "../packs/sliders";
import type { PackId } from "../packs/types";
import {
  DEFAULT_DELTA_FRACTION,
  TALK_PACK_IDS,
  TALK_REGIONAL_PRESET_IDS,
  TALK_REGIONAL_REGIONS,
  TALK_REGIONAL_SLIDER_IDS,
  TALK_SLIDER_IDS,
  type RecipeContext,
  type TalkApplyPack,
  type TalkApplyRegionalPreset,
  type TalkDeltaRegionalSlider,
  type TalkDeltaSlider,
  type TalkErrorCode,
  type TalkPatch,
  type TalkRefuse,
  type TalkResponse,
  type TalkSetRegionalSlider,
  type TalkSetSlider,
} from "./types";

export type NormalizeOk = {
  ok: true;
  response: TalkResponse;
};

export type NormalizeErr = {
  ok: false;
  code: TalkErrorCode;
  message: string;
};

export type NormalizeResult = NormalizeOk | NormalizeErr;

function sliderSpec(id: string): SliderSpec | null {
  if (id === "duotone") return DUOTONE_SLIDER;
  return SEMANTIC_SLIDERS.find((s) => s.id === id) ?? null;
}

function regionalSliderSpec(id: string) {
  return REGIONAL_SLIDERS.find((s) => s.id === id) ?? null;
}

function isPackId(id: unknown): id is PackId {
  return typeof id === "string" && (TALK_PACK_IDS as readonly string[]).includes(id);
}

function isSliderId(id: unknown): id is SemanticSliderId {
  return typeof id === "string" && (TALK_SLIDER_IDS as readonly string[]).includes(id);
}

function isRegionalSliderId(id: unknown): id is RegionalSliderId {
  return (
    typeof id === "string" &&
    (TALK_REGIONAL_SLIDER_IDS as readonly string[]).includes(id)
  );
}

function isRegionalRegion(id: unknown): id is RegionalRegion {
  return typeof id === "string" && (TALK_REGIONAL_REGIONS as readonly string[]).includes(id);
}

function isRegionalPresetId(id: unknown): id is RegionalPresetId {
  return (
    typeof id === "string" &&
    (TALK_REGIONAL_PRESET_IDS as readonly string[]).includes(id)
  );
}

function requireMask(ctx: RecipeContext, tool: string): NormalizeErr | null {
  if (!ctx.hasMask) {
    return {
      ok: false,
      code: "NO_MASK",
      message: `${tool} requires an active person mask on main`,
    };
  }
  return null;
}

function defaultDelta(spec: SliderSpec): number {
  return DEFAULT_DELTA_FRACTION * (spec.max - spec.min);
}

function currentSliderAmount(
  ctx: RecipeContext,
  sliderId: SemanticSliderId,
): number {
  const s = ctx.sliders;
  switch (sliderId) {
    case "exposure":
      return s.exposure;
    case "contrast":
      return s.contrast;
    case "warmth":
      return s.warmth;
    case "chroma":
      return s.chroma;
    case "fade":
      return s.fade;
    case "grain":
      return s.grain;
    case "vignette":
      return s.vignette;
    case "duotone":
      return s.duotone ?? 0;
    default:
      return 0;
  }
}

function currentRegionalSliderAmount(
  ctx: RecipeContext,
  sliderId: RegionalSliderId,
): number {
  return ctx.regionalSliders?.[sliderId] ?? 0;
}

function parseRefuse(raw: unknown): TalkRefuse | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "refuse must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  if (typeof rec.code !== "string" || !rec.code) {
    return { ok: false, code: "SCHEMA", message: "refuse.code required" };
  }
  if (typeof rec.reason !== "string" || !rec.reason) {
    return { ok: false, code: "SCHEMA", message: "refuse.reason required" };
  }
  return { code: rec.code, reason: rec.reason };
}

function parseApplyPack(raw: unknown): TalkApplyPack | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "applyPack must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  if (!isPackId(rec.packId)) {
    return {
      ok: false,
      code: "UNKNOWN_PACK",
      message: `unknown packId "${String(rec.packId)}"`,
    };
  }
  let intensity: number | undefined;
  if (rec.intensity !== undefined) {
    if (typeof rec.intensity !== "number" || !Number.isFinite(rec.intensity)) {
      return { ok: false, code: "SCHEMA", message: "applyPack.intensity must be a number" };
    }
    intensity = Math.min(1, Math.max(0, rec.intensity));
  }
  return { packId: rec.packId, ...(intensity !== undefined ? { intensity } : {}) };
}

function parseApplyRegionalPreset(
  raw: unknown,
  ctx: RecipeContext,
): TalkApplyRegionalPreset | NormalizeErr {
  const maskErr = requireMask(ctx, "applyRegionalPreset");
  if (maskErr) return maskErr;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "applyRegionalPreset must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  if (!isRegionalPresetId(rec.presetId)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `unknown regional presetId "${String(rec.presetId)}"`,
    };
  }
  return { presetId: rec.presetId };
}

function parseGlobalPatch(
  raw: Record<string, unknown>,
  ctx: RecipeContext,
  index: number,
): TalkSetSlider | NormalizeErr {
  const op = raw.op;
  if (op !== "set_slider" && op !== "delta_slider") {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].op must be set_slider or delta_slider`,
    };
  }
  if (!isSliderId(raw.sliderId)) {
    return {
      ok: false,
      code: "UNKNOWN_SLIDER",
      message: `unknown sliderId "${String(raw.sliderId)}"`,
    };
  }
  const spec = sliderSpec(raw.sliderId);
  if (!spec) {
    return {
      ok: false,
      code: "UNKNOWN_SLIDER",
      message: `unknown sliderId "${raw.sliderId}"`,
    };
  }

  if (op === "set_slider") {
    if (typeof raw.value !== "number" || !Number.isFinite(raw.value)) {
      return {
        ok: false,
        code: "SCHEMA",
        message: `patches[${index}].value must be a finite number`,
      };
    }
    const value = clampSliderValue(spec, raw.value);
    return { op: "set_slider", sliderId: raw.sliderId, value };
  }

  let delta: number;
  if (raw.delta === undefined || raw.delta === null) {
    delta = defaultDelta(spec);
  } else if (typeof raw.delta !== "number" || !Number.isFinite(raw.delta)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].delta must be a finite number`,
    };
  } else {
    delta = raw.delta;
  }
  const next = clampSliderValue(
    spec,
    currentSliderAmount(ctx, raw.sliderId) + delta,
  );
  return { op: "set_slider", sliderId: raw.sliderId, value: next };
}

function parseRegionalPatch(
  raw: Record<string, unknown>,
  ctx: RecipeContext,
  index: number,
): TalkSetRegionalSlider | NormalizeErr {
  const maskErr = requireMask(ctx, "regional slider patch");
  if (maskErr) return maskErr;

  const op = raw.op;
  if (op !== "set_regional_slider" && op !== "delta_regional_slider") {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].op must be set_regional_slider or delta_regional_slider`,
    };
  }
  if (!isRegionalRegion(raw.region)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].region must be subject or background`,
    };
  }
  if (!isRegionalSliderId(raw.sliderId)) {
    return {
      ok: false,
      code: "UNKNOWN_SLIDER",
      message: `unknown regional sliderId "${String(raw.sliderId)}"`,
    };
  }
  const spec = regionalSliderSpec(raw.sliderId);
  if (!spec) {
    return {
      ok: false,
      code: "UNKNOWN_SLIDER",
      message: `unknown regional sliderId "${raw.sliderId}"`,
    };
  }
  if (spec.region !== raw.region) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}]: slider "${raw.sliderId}" belongs to region "${spec.region}"`,
    };
  }

  const clampRegional = (v: number) =>
    Math.min(spec.max, Math.max(spec.min, v));

  if (op === "set_regional_slider") {
    if (typeof raw.value !== "number" || !Number.isFinite(raw.value)) {
      return {
        ok: false,
        code: "SCHEMA",
        message: `patches[${index}].value must be a finite number`,
      };
    }
    return {
      op: "set_regional_slider",
      region: raw.region,
      sliderId: raw.sliderId,
      value: clampRegional(raw.value),
    };
  }

  let delta: number;
  if (raw.delta === undefined || raw.delta === null) {
    delta = defaultDeltaForRegionalSlider(raw.sliderId);
  } else if (typeof raw.delta !== "number" || !Number.isFinite(raw.delta)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].delta must be a finite number`,
    };
  } else {
    delta = raw.delta;
  }
  const next = clampRegional(
    currentRegionalSliderAmount(ctx, raw.sliderId) + delta,
  );
  return {
    op: "set_regional_slider",
    region: raw.region,
    sliderId: raw.sliderId,
    value: next,
  };
}

function parsePatch(
  raw: unknown,
  ctx: RecipeContext,
  index: number,
): TalkSetSlider | TalkSetRegionalSlider | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: `patches[${index}] must be an object` };
  }
  const rec = raw as Record<string, unknown>;
  const op = rec.op;
  if (op === "set_slider" || op === "delta_slider") {
    return parseGlobalPatch(rec, ctx, index);
  }
  if (op === "set_regional_slider" || op === "delta_regional_slider") {
    return parseRegionalPatch(rec, ctx, index);
  }
  return {
    ok: false,
    code: "SCHEMA",
    message: `patches[${index}].op unknown`,
  };
}

function updateCtxAfterPatch(ctx: RecipeContext, patch: TalkPatch): RecipeContext {
  if (patch.op === "set_slider") {
    return {
      ...ctx,
      sliders: { ...ctx.sliders, [patch.sliderId]: patch.value },
    };
  }
  if (patch.op === "set_regional_slider") {
    return {
      ...ctx,
      regionalSliders: {
        bg_mute: ctx.regionalSliders?.bg_mute ?? 0,
        bg_fade: ctx.regionalSliders?.bg_fade ?? 0,
        subject_pop: ctx.regionalSliders?.subject_pop ?? 0,
        subject_chroma: ctx.regionalSliders?.subject_chroma ?? 0,
        [patch.sliderId]: patch.value,
      },
    };
  }
  return ctx;
}

/**
 * Normalize raw model / API JSON into a TalkResponse with absolute set_slider patches.
 * Folds successive deltas against updated context amounts within one turn.
 */
export function normalizeTalkResponse(
  raw: unknown,
  recipeContext: RecipeContext,
): NormalizeResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "TalkResponse must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  const out: TalkResponse = {};
  let ctx: RecipeContext = {
    packId: recipeContext.packId,
    packVersion: recipeContext.packVersion,
    sliders: { ...recipeContext.sliders },
    mainEffectIds: recipeContext.mainEffectIds
      ? [...recipeContext.mainEffectIds]
      : undefined,
    hasMask: recipeContext.hasMask,
    regionalSliders: recipeContext.regionalSliders
      ? { ...recipeContext.regionalSliders }
      : undefined,
  };

  if ("refuse" in rec && rec.refuse !== undefined && rec.refuse !== null) {
    const refuse = parseRefuse(rec.refuse);
    if ("ok" in refuse && refuse.ok === false) return refuse;
    out.refuse = refuse as TalkRefuse;
    if (typeof rec.say === "string" && rec.say.trim()) {
      out.say = rec.say.trim().slice(0, 200);
    }
    return { ok: true, response: out };
  }

  if ("applyPack" in rec && rec.applyPack !== undefined && rec.applyPack !== null) {
    const pack = parseApplyPack(rec.applyPack);
    if ("ok" in pack && pack.ok === false) return pack;
    out.applyPack = pack as TalkApplyPack;
  }

  if (
    "applyRegionalPreset" in rec &&
    rec.applyRegionalPreset !== undefined &&
    rec.applyRegionalPreset !== null
  ) {
    const preset = parseApplyRegionalPreset(rec.applyRegionalPreset, ctx);
    if ("ok" in preset && preset.ok === false) return preset;
    out.applyRegionalPreset = preset as TalkApplyRegionalPreset;
  }

  if ("regenerateMask" in rec && rec.regenerateMask !== undefined && rec.regenerateMask !== null) {
    if (typeof rec.regenerateMask !== "boolean") {
      return { ok: false, code: "SCHEMA", message: "regenerateMask must be boolean" };
    }
    const maskErr = requireMask(ctx, "regenerateMask");
    if (maskErr) return maskErr;
    if (rec.regenerateMask) {
      out.regenerateMask = true;
    }
  }

  if ("patches" in rec && rec.patches !== undefined && rec.patches !== null) {
    if (!Array.isArray(rec.patches)) {
      return { ok: false, code: "SCHEMA", message: "patches must be an array" };
    }
    const patches: TalkPatch[] = [];
    for (let i = 0; i < rec.patches.length; i++) {
      const patch = parsePatch(rec.patches[i], ctx, i);
      if ("ok" in patch && patch.ok === false) return patch;
      patches.push(patch as TalkPatch);
      ctx = updateCtxAfterPatch(ctx, patch as TalkPatch);
    }
    if (patches.length > 0) out.patches = patches;
  }

  if (typeof rec.say === "string" && rec.say.trim()) {
    out.say = rec.say.trim().slice(0, 200);
  }

  if (
    !out.applyPack &&
    !out.patches?.length &&
    !out.applyRegionalPreset &&
    !out.regenerateMask &&
    !out.refuse
  ) {
    return {
      ok: false,
      code: "SCHEMA",
      message: "TalkResponse empty: need applyPack, patches, applyRegionalPreset, regenerateMask, or refuse",
    };
  }

  return { ok: true, response: out };
}

/** Re-export for tests. */
export function defaultDeltaForSlider(sliderId: SemanticSliderId): number {
  const spec = sliderSpec(sliderId);
  if (!spec) throw new Error(`unknown slider ${sliderId}`);
  return defaultDelta(spec);
}

export function isDeltaSlider(p: TalkPatch): p is TalkDeltaSlider {
  return p.op === "delta_slider";
}

export function isDeltaRegionalSlider(p: TalkPatch): p is TalkDeltaRegionalSlider {
  return p.op === "delta_regional_slider";
}
