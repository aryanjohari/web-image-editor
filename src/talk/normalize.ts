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
  DEFAULT_TRANSFORM_NUDGE_SCALE,
  DEFAULT_TRANSFORM_NUDGE_XY,
  TALK_PACK_IDS,
  TALK_REGIONAL_PRESET_IDS,
  TALK_REGIONAL_REGIONS,
  TALK_REGIONAL_SLIDER_IDS,
  TALK_SLIDER_IDS,
  TALK_TEXT_POSITIONS,
  TALK_TRANSFORM_TARGETS,
  TALK_TYPE_PRESETS,
  type RecipeContext,
  type RecipeContextTransform,
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
  type TalkSetTextContent,
  type TalkSetTextHint,
  type TalkSetTransform,
  type TalkTransformTarget,
} from "./types";
import type { TextPositionHint, TypePresetId } from "../packs/types";
import { clampTransform } from "../canvas/pointerToTransform";

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
    case "grain_size":
      return s.grain_size ?? 0.5;
    case "vignette":
      return s.vignette;
    case "blur":
      return s.blur ?? 0;
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

function parseSetTextHint(raw: unknown): TalkSetTextHint | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "setTextHint must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  const out: TalkSetTextHint = {};
  if (rec.position !== undefined) {
    if (
      typeof rec.position !== "string" ||
      !(TALK_TEXT_POSITIONS as readonly string[]).includes(rec.position)
    ) {
      return { ok: false, code: "SCHEMA", message: `invalid text position "${String(rec.position)}"` };
    }
    out.position = rec.position as TextPositionHint;
  }
  if (rec.typePreset !== undefined) {
    if (
      typeof rec.typePreset !== "string" ||
      !(TALK_TYPE_PRESETS as readonly string[]).includes(rec.typePreset)
    ) {
      return {
        ok: false,
        code: "SCHEMA",
        message: `invalid typePreset "${String(rec.typePreset)}"`,
      };
    }
    out.typePreset = rec.typePreset as TypePresetId;
  }
  if (!out.position && !out.typePreset) {
    return {
      ok: false,
      code: "SCHEMA",
      message: "setTextHint requires position and/or typePreset",
    };
  }
  return out;
}

function isTransformTarget(id: unknown): id is TalkTransformTarget {
  return typeof id === "string" && (TALK_TRANSFORM_TARGETS as readonly string[]).includes(id);
}

function parseSetTextContent(raw: unknown): TalkSetTextContent | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "setTextContent must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  if (typeof rec.content !== "string") {
    return { ok: false, code: "SCHEMA", message: "setTextContent.content must be a string" };
  }
  const content = rec.content.slice(0, 200);
  return { content };
}

function currentTargetTransform(
  ctx: RecipeContext,
  target: TalkTransformTarget,
): RecipeContextTransform {
  if (target === "text") {
    return ctx.textTransform ?? { x: 0, y: -0.35, scaleX: 1, scaleY: 1 };
  }
  return ctx.overlayTransform ?? { x: 0, y: 0, scaleX: 1, scaleY: 1 };
}

function parseSetTransform(raw: unknown): TalkSetTransform | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "setTransform must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  if (!isTransformTarget(rec.target)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `setTransform.target must be text or overlay`,
    };
  }
  const out: TalkSetTransform = { target: rec.target };
  for (const key of ["x", "y", "scaleX", "scaleY"] as const) {
    if (rec[key] === undefined) continue;
    if (typeof rec[key] !== "number" || !Number.isFinite(rec[key])) {
      return { ok: false, code: "SCHEMA", message: `setTransform.${key} must be a finite number` };
    }
    out[key] = rec[key];
  }
  if (
    out.x === undefined &&
    out.y === undefined &&
    out.scaleX === undefined &&
    out.scaleY === undefined
  ) {
    return {
      ok: false,
      code: "SCHEMA",
      message: "setTransform requires at least one of x,y,scaleX,scaleY",
    };
  }
  const clamped = clampTransform({
    x: out.x ?? 0,
    y: out.y ?? 0,
    scaleX: out.scaleX ?? 1,
    scaleY: out.scaleY ?? out.scaleX ?? 1,
    rotation: 0,
  });
  if (out.x !== undefined) out.x = clamped.x;
  if (out.y !== undefined) out.y = clamped.y;
  if (out.scaleX !== undefined) out.scaleX = clamped.scaleX;
  if (out.scaleY !== undefined) out.scaleY = clamped.scaleY;
  return out;
}

function parseNudgeTransform(
  raw: unknown,
  ctx: RecipeContext,
): TalkSetTransform | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: "nudgeTransform must be an object" };
  }
  const rec = raw as Record<string, unknown>;
  if (!isTransformTarget(rec.target)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: "nudgeTransform.target must be text or overlay",
    };
  }

  const readDelta = (
    key: "dx" | "dy" | "dScale",
    defaultMag: number,
  ): { ok: true; value: number | undefined } | NormalizeErr => {
    if (!(key in rec) || rec[key] === undefined) {
      return { ok: true, value: undefined };
    }
    if (rec[key] === null) {
      return { ok: true, value: defaultMag };
    }
    if (typeof rec[key] !== "number" || !Number.isFinite(rec[key])) {
      return {
        ok: false,
        code: "SCHEMA",
        message: `nudgeTransform.${key} must be a finite number`,
      };
    }
    return { ok: true, value: rec[key] as number };
  };

  const dxR = readDelta("dx", DEFAULT_TRANSFORM_NUDGE_XY);
  if ("code" in dxR) return dxR;
  const dyR = readDelta("dy", DEFAULT_TRANSFORM_NUDGE_XY);
  if ("code" in dyR) return dyR;
  const dsR = readDelta("dScale", DEFAULT_TRANSFORM_NUDGE_SCALE);
  if ("code" in dsR) return dsR;

  if (dxR.value === undefined && dyR.value === undefined && dsR.value === undefined) {
    return {
      ok: false,
      code: "SCHEMA",
      message: "nudgeTransform requires dx, dy, and/or dScale",
    };
  }

  const cur = currentTargetTransform(ctx, rec.target);
  const dx = dxR.value ?? 0;
  const dy = dyR.value ?? 0;
  const dScale = dsR.value ?? 0;
  const next = clampTransform({
    x: cur.x + dx,
    y: cur.y + dy,
    scaleX: cur.scaleX + dScale,
    scaleY: cur.scaleY + dScale,
    rotation: 0,
  });

  const out: TalkSetTransform = { target: rec.target };
  if (dxR.value !== undefined) out.x = next.x;
  if (dyR.value !== undefined) out.y = next.y;
  if (dsR.value !== undefined) {
    out.scaleX = next.scaleX;
    out.scaleY = next.scaleY;
  }
  return out;
}

function mergeSetTransform(
  base: TalkSetTransform | undefined,
  next: TalkSetTransform,
): TalkSetTransform {
  if (!base || base.target !== next.target) return next;
  return {
    target: next.target,
    x: next.x ?? base.x,
    y: next.y ?? base.y,
    scaleX: next.scaleX ?? base.scaleX,
    scaleY: next.scaleY ?? base.scaleY,
  };
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
        bg_blur: ctx.regionalSliders?.bg_blur ?? 0,
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
    hasOverlay: recipeContext.hasOverlay,
    hasText: recipeContext.hasText,
    textContent: recipeContext.textContent,
    textTransform: recipeContext.textTransform
      ? { ...recipeContext.textTransform }
      : undefined,
    overlayTransform: recipeContext.overlayTransform
      ? { ...recipeContext.overlayTransform }
      : undefined,
    selection: recipeContext.selection,
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

  if ("setTextHint" in rec && rec.setTextHint !== undefined && rec.setTextHint !== null) {
    const hint = parseSetTextHint(rec.setTextHint);
    if ("ok" in hint && hint.ok === false) return hint;
    out.setTextHint = hint as TalkSetTextHint;
  }

  if (
    "setTextContent" in rec &&
    rec.setTextContent !== undefined &&
    rec.setTextContent !== null
  ) {
    const content = parseSetTextContent(rec.setTextContent);
    if ("ok" in content && content.ok === false) return content;
    out.setTextContent = content as TalkSetTextContent;
  }

  if ("setTransform" in rec && rec.setTransform !== undefined && rec.setTransform !== null) {
    const tf = parseSetTransform(rec.setTransform);
    if ("ok" in tf && tf.ok === false) return tf;
    out.setTransform = tf as TalkSetTransform;
  }

  if (
    "nudgeTransform" in rec &&
    rec.nudgeTransform !== undefined &&
    rec.nudgeTransform !== null
  ) {
    const nudged = parseNudgeTransform(rec.nudgeTransform, ctx);
    if ("ok" in nudged && nudged.ok === false) return nudged;
    out.setTransform = mergeSetTransform(out.setTransform, nudged as TalkSetTransform);
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
    !out.setTextHint &&
    !out.setTextContent &&
    !out.setTransform &&
    !out.regenerateMask &&
    !out.refuse
  ) {
    return {
      ok: false,
      code: "SCHEMA",
      message:
        "TalkResponse empty: need applyPack, patches, applyRegionalPreset, setTextHint, setTextContent, setTransform/nudgeTransform, regenerateMask, or refuse",
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
