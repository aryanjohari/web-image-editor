/**
 * Apply normalized TalkResponse via shipped pack/slider helpers (M03 §5; M05; M07).
 * All-or-nothing on a recipe copy. Never PathPatches packId alone.
 */

import { applyPack, applyTextLayout } from "../packs/applyPack";
import { applyRegionalPreset, applyRegionalSlider } from "../packs/regionalSliders";
import { applySemanticSlider } from "../packs/sliders";
import { identityText } from "../recipe/identityRecipe";
import { applyPathPatch } from "../recipe/pathPatch";
import type { PathPatch, Recipe, Transform2D } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { clampTransform } from "../canvas/pointerToTransform";
import type { TalkErrorCode, TalkResponse, TalkSetTransform } from "./types";

export type ApplyTalkOk = {
  ok: true;
  recipe: Recipe;
  say?: string;
  /** Host runs client mask worker (Lab onRegenerateMask). */
  regenerateMask?: boolean;
};

export type ApplyTalkRefuse = {
  ok: false;
  code: "REFUSE_GENERATIVE";
  message: string;
  refuseCode: string;
};

export type ApplyTalkErr = {
  ok: false;
  code: TalkErrorCode;
  message: string;
};

export type ApplyTalkResult = ApplyTalkOk | ApplyTalkRefuse | ApplyTalkErr;

function mapApplyError(e: unknown): ApplyTalkErr {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (lower.includes("out of range") || lower.includes("oor")) {
    return { ok: false, code: "OOR", message: msg };
  }
  if (lower.includes("allowlist") || lower.includes("illegal path")) {
    return { ok: false, code: "ALLOWLIST", message: msg };
  }
  if (lower.includes("unknown pack") || lower.includes('pack "')) {
    return { ok: false, code: "UNKNOWN_PACK", message: msg };
  }
  if (lower.includes("unknown slider") || lower.includes("unknown regional")) {
    return { ok: false, code: "UNKNOWN_SLIDER", message: msg };
  }
  if (lower.includes("validate") || lower.includes("schema")) {
    return { ok: false, code: "VALIDATE", message: msg };
  }
  return { ok: false, code: "VALIDATE", message: msg };
}

function ensureText(recipe: Recipe, content?: string): Recipe {
  const existing = recipe.objects.find((o) => o.kind === "text");
  if (existing && existing.kind === "text") {
    if (content === undefined) return recipe;
    return applyPathPatch(recipe, [
      { path: "/objects/text/text/content", value: content },
    ]);
  }
  return validateRecipe({
    ...recipe,
    objects: [...recipe.objects, identityText(content ?? "Prism")],
  });
}

function applySetTransform(recipe: Recipe, tf: TalkSetTransform): Recipe {
  const id = tf.target;
  if (id === "text") {
    recipe = ensureText(recipe);
  } else {
    const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
    if (!overlay) {
      throw new Error('setTransform target "overlay" requires an overlay object');
    }
  }
  const obj = recipe.objects.find((o) =>
    id === "text" ? o.kind === "text" : o.kind === "image" && o.role === "overlay",
  );
  if (!obj) throw new Error(`setTransform: missing ${id}`);
  const cur = obj.transform;
  const next = clampTransform({
    x: tf.x ?? cur.x,
    y: tf.y ?? cur.y,
    scaleX: tf.scaleX ?? cur.scaleX,
    scaleY: tf.scaleY ?? (tf.scaleX !== undefined ? tf.scaleX : cur.scaleY),
    rotation: cur.rotation,
  });
  // Uniform when either scale field written
  if (tf.scaleX !== undefined || tf.scaleY !== undefined) {
    const s = tf.scaleX ?? tf.scaleY ?? next.scaleX;
    next.scaleX = s;
    next.scaleY = s;
  }
  const patches: PathPatch = [];
  if (tf.x !== undefined) patches.push({ path: `/objects/${id}/transform/x`, value: next.x });
  if (tf.y !== undefined) patches.push({ path: `/objects/${id}/transform/y`, value: next.y });
  if (tf.scaleX !== undefined || tf.scaleY !== undefined) {
    patches.push({ path: `/objects/${id}/transform/scaleX`, value: next.scaleX });
    patches.push({ path: `/objects/${id}/transform/scaleY`, value: next.scaleY });
  }
  return patches.length ? applyPathPatch(recipe, patches) : recipe;
}

/** Apply transform fields via PathPatch (Lab canvas / inspector share this). */
export function patchObjectTransform(
  recipe: Recipe,
  objectId: "text" | "overlay",
  transform: Transform2D,
): Recipe {
  const t = clampTransform(transform);
  return applyPathPatch(recipe, [
    { path: `/objects/${objectId}/transform/x`, value: t.x },
    { path: `/objects/${objectId}/transform/y`, value: t.y },
    { path: `/objects/${objectId}/transform/scaleX`, value: t.scaleX },
    { path: `/objects/${objectId}/transform/scaleY`, value: t.scaleY },
  ]);
}

/**
 * Apply talk on a copy. On any step failure, discard (caller keeps prior recipe).
 * Slider patches do not clear packId/packVersion (M02 provenance / F7).
 */
export function applyTalk(recipe: Recipe, response: TalkResponse): ApplyTalkResult {
  if (response.refuse) {
    return {
      ok: false,
      code: "REFUSE_GENERATIVE",
      message: response.refuse.reason,
      refuseCode: response.refuse.code,
    };
  }

  try {
    let next = recipe;

    if (response.applyPack) {
      next = applyPack(next, response.applyPack.packId, {
        intensity: response.applyPack.intensity ?? 1,
      });
    }

    if (response.applyRegionalPreset) {
      next = applyRegionalPreset(next, response.applyRegionalPreset.presetId);
    }

    if (response.setTextContent) {
      next = ensureText(next, response.setTextContent.content);
    }

    if (response.setTextHint) {
      next = applyTextLayout(next, {
        position: response.setTextHint.position,
        typePreset: response.setTextHint.typePreset,
      });
    }

    if (response.setTransform) {
      next = applySetTransform(next, response.setTransform);
    }

    if (response.patches) {
      for (const patch of response.patches) {
        if (patch.op === "set_slider") {
          next = applySemanticSlider(next, patch.sliderId, patch.value);
        } else if (patch.op === "set_regional_slider") {
          next = applyRegionalSlider(next, patch.sliderId, patch.value);
        } else {
          return {
            ok: false,
            code: "SCHEMA",
            message: "applyTalk expects normalized set_slider / set_regional_slider patches only",
          };
        }
      }
    }

    const hasRecipeWrite =
      response.applyPack ||
      response.applyRegionalPreset ||
      response.setTextHint ||
      response.setTextContent ||
      response.setTransform ||
      (response.patches && response.patches.length > 0);

    if (!hasRecipeWrite && !response.regenerateMask) {
      return {
        ok: false,
        code: "SCHEMA",
        message: "nothing to apply",
      };
    }

    return {
      ok: true,
      recipe: next,
      ...(response.say ? { say: response.say } : {}),
      ...(response.regenerateMask ? { regenerateMask: true } : {}),
    };
  } catch (e) {
    return mapApplyError(e);
  }
}
