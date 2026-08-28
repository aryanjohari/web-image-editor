/**
 * Pure TalkResponse normalizer (M03 §4–5).
 * Delta → absolute clamp via SEMANTIC_SLIDERS / DUOTONE_SLIDER.
 * Unknown pack/slider → fail closed. refuse → pass through (no write later).
 */

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
  TALK_SLIDER_IDS,
  type RecipeContext,
  type TalkApplyPack,
  type TalkDeltaSlider,
  type TalkErrorCode,
  type TalkPatch,
  type TalkRefuse,
  type TalkResponse,
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

function isPackId(id: unknown): id is PackId {
  return typeof id === "string" && (TALK_PACK_IDS as readonly string[]).includes(id);
}

function isSliderId(id: unknown): id is SemanticSliderId {
  return typeof id === "string" && (TALK_SLIDER_IDS as readonly string[]).includes(id);
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

function parsePatch(
  raw: unknown,
  ctx: RecipeContext,
  index: number,
): TalkSetSlider | NormalizeErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "SCHEMA", message: `patches[${index}] must be an object` };
  }
  const rec = raw as Record<string, unknown>;
  const op = rec.op;
  if (op !== "set_slider" && op !== "delta_slider") {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].op must be set_slider or delta_slider`,
    };
  }
  if (!isSliderId(rec.sliderId)) {
    return {
      ok: false,
      code: "UNKNOWN_SLIDER",
      message: `unknown sliderId "${String(rec.sliderId)}"`,
    };
  }
  const spec = sliderSpec(rec.sliderId);
  if (!spec) {
    return {
      ok: false,
      code: "UNKNOWN_SLIDER",
      message: `unknown sliderId "${rec.sliderId}"`,
    };
  }

  if (op === "set_slider") {
    if (typeof rec.value !== "number" || !Number.isFinite(rec.value)) {
      return {
        ok: false,
        code: "SCHEMA",
        message: `patches[${index}].value must be a finite number`,
      };
    }
    const value = clampSliderValue(spec, rec.value);
    return { op: "set_slider", sliderId: rec.sliderId, value };
  }

  let delta: number;
  if (rec.delta === undefined || rec.delta === null) {
    delta = defaultDelta(spec);
  } else if (typeof rec.delta !== "number" || !Number.isFinite(rec.delta)) {
    return {
      ok: false,
      code: "SCHEMA",
      message: `patches[${index}].delta must be a finite number`,
    };
  } else {
    delta = rec.delta;
  }
  const next = clampSliderValue(
    spec,
    currentSliderAmount(ctx, rec.sliderId) + delta,
  );
  return { op: "set_slider", sliderId: rec.sliderId, value: next };
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
  const ctx: RecipeContext = {
    packId: recipeContext.packId,
    packVersion: recipeContext.packVersion,
    sliders: { ...recipeContext.sliders },
    mainEffectIds: recipeContext.mainEffectIds
      ? [...recipeContext.mainEffectIds]
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

  if ("patches" in rec && rec.patches !== undefined && rec.patches !== null) {
    if (!Array.isArray(rec.patches)) {
      return { ok: false, code: "SCHEMA", message: "patches must be an array" };
    }
    const patches: TalkPatch[] = [];
    for (let i = 0; i < rec.patches.length; i++) {
      const patch = parsePatch(rec.patches[i], ctx, i);
      if ("ok" in patch && patch.ok === false) return patch;
      const set = patch as TalkSetSlider;
      patches.push(set);
      ctx.sliders = { ...ctx.sliders, [set.sliderId]: set.value };
    }
    if (patches.length > 0) out.patches = patches;
  }

  if (typeof rec.say === "string" && rec.say.trim()) {
    out.say = rec.say.trim().slice(0, 200);
  }

  if (!out.applyPack && !out.patches?.length && !out.refuse) {
    return {
      ok: false,
      code: "SCHEMA",
      message: "TalkResponse empty: need applyPack, patches, or refuse",
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
