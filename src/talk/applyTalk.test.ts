import { describe, expect, it } from "vitest";
import { applyPack } from "../packs/applyPack";
import {
  applySemanticSlider,
  readSliderValue,
} from "../packs/sliders";
import { recipeWithMain } from "../recipe/identityRecipe";
import { applyTalk } from "./applyTalk";
import { buildRecipeContext } from "./context";
import { normalizeTalkResponse } from "./normalize";
import type { TalkResponse } from "./types";

function baseRecipe() {
  return applyPack(recipeWithMain("main-asset"), "warm-film", { intensity: 1 });
}

describe("applyTalk", () => {
  it("refuse → no write (caller keeps prior)", () => {
    const recipe = baseRecipe();
    const before = JSON.stringify(recipe);
    const result = applyTalk(recipe, {
      refuse: { code: "GENERATIVE", reason: "beach / inpaint not supported" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("REFUSE_GENERATIVE");
    expect(JSON.stringify(recipe)).toBe(before);
  });

  it("applyPack then patches; packId set by pack", () => {
    const recipe = recipeWithMain("main-asset");
    const result = applyTalk(recipe, {
      applyPack: { packId: "editorial-bw", intensity: 1 },
      patches: [{ op: "set_slider", sliderId: "grain", value: 0.2 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.packId).toBe("editorial-bw");
    expect(result.recipe.packVersion).toBeTruthy();
    expect(readSliderValue(result.recipe, "grain")).toBeCloseTo(0.2);
  });

  it("slider-like patch does not clear packId (F7)", () => {
    const recipe = baseRecipe();
    expect(recipe.packId).toBe("warm-film");
    const packVersion = recipe.packVersion;
    const result = applyTalk(recipe, {
      patches: [{ op: "set_slider", sliderId: "grain", value: 0.2 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.packId).toBe("warm-film");
    expect(result.recipe.packVersion).toBe(packVersion);
    expect(readSliderValue(result.recipe, "grain")).toBeCloseTo(0.2);
  });

  it("identity: talk grain 0.2 ≡ applySemanticSlider grain 0.2", () => {
    const recipe = baseRecipe();
    const viaTalk = applyTalk(recipe, {
      patches: [{ op: "set_slider", sliderId: "grain", value: 0.2 }],
    });
    const viaSlider = applySemanticSlider(recipe, "grain", 0.2);
    expect(viaTalk.ok).toBe(true);
    if (!viaTalk.ok) return;
    expect(viaTalk.recipe).toEqual(viaSlider);
  });

  it("rejects non-normalized delta_slider patches", () => {
    const recipe = baseRecipe();
    const before = structuredClone(recipe);
    const result = applyTalk(recipe, {
      patches: [
        {
          op: "delta_slider",
          sliderId: "grain",
          delta: -0.1,
        },
      ],
    } as TalkResponse);
    expect(result.ok).toBe(false);
    expect(recipe).toEqual(before);
  });

  it("normalize + apply: less grain matches slider delta path", () => {
    const recipe = baseRecipe();
    const ctx = buildRecipeContext(recipe);
    const grainBefore = readSliderValue(recipe, "grain");
    const norm = normalizeTalkResponse(
      {
        patches: [{ op: "delta_slider", sliderId: "grain", delta: -0.1 }],
      },
      ctx,
    );
    expect(norm.ok).toBe(true);
    if (!norm.ok) return;
    const applied = applyTalk(recipe, norm.response);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(readSliderValue(applied.recipe, "grain")).toBeCloseTo(
      grainBefore - 0.1,
    );
  });

  it("empty TalkResponse fails closed", () => {
    const recipe = baseRecipe();
    const result = applyTalk(recipe, {} as TalkResponse);
    expect(result.ok).toBe(false);
  });

  it("pack then patch order works", () => {
    const recipe = baseRecipe();
    const result = applyTalk(recipe, {
      applyPack: { packId: "warm-film" },
      patches: [
        { op: "set_slider", sliderId: "grain", value: 0.2 },
        { op: "set_slider", sliderId: "grain", value: 0.3 },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.packId).toBe("warm-film");
    expect(readSliderValue(result.recipe, "grain")).toBeCloseTo(0.3);
  });
});
