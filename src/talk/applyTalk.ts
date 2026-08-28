/**
 * Apply normalized TalkResponse via shipped pack/slider helpers (M03 §5).
 * All-or-nothing on a recipe copy. Never PathPatches packId alone.
 */

import { applyPack } from "../packs/applyPack";
import { applySemanticSlider } from "../packs/sliders";
import type { Recipe } from "../recipe/types";
import type { TalkErrorCode, TalkResponse } from "./types";

export type ApplyTalkOk = {
  ok: true;
  recipe: Recipe;
  say?: string;
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
  if (lower.includes("unknown slider")) {
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

    if (response.patches) {
      for (const patch of response.patches) {
        if (patch.op !== "set_slider") {
          return {
            ok: false,
            code: "SCHEMA",
            message: "applyTalk expects normalized set_slider patches only",
          };
        }
        next = applySemanticSlider(next, patch.sliderId, patch.value);
      }
    }

    if (!response.applyPack && (!response.patches || response.patches.length === 0)) {
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
    };
  } catch (e) {
    return mapApplyError(e);
  }
}
