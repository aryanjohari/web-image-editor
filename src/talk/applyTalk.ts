/**
 * Apply normalized TalkResponse via shipped pack/slider helpers (M03 §5; M05 regional).
 * All-or-nothing on a recipe copy. Never PathPatches packId alone.
 */

import { applyPack } from "../packs/applyPack";
import { applyRegionalPreset, applyRegionalSlider } from "../packs/regionalSliders";
import { applySemanticSlider } from "../packs/sliders";
import type { Recipe } from "../recipe/types";
import type { TalkErrorCode, TalkResponse } from "./types";

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
