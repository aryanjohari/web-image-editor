import { describe, expect, it } from "vitest";
import { attachPersonMask } from "../masks/segment";
import { applyRegionalSlider } from "../packs/regionalSliders";
import { applyPack } from "../packs/applyPack";
import { recipeWithMain } from "../recipe/identityRecipe";
import { applyTalk } from "./applyTalk";
import { buildRecipeContext } from "./context";
import { normalizeTalkResponse } from "./normalize";
import type { RecipeContext } from "./types";

function maskedCtx(): RecipeContext {
  const recipe = attachPersonMask(
    applyPack(recipeWithMain("main-asset"), "warm-film"),
    "mask-1",
  );
  return buildRecipeContext(recipe);
}

describe("buildRecipeContext regional", () => {
  it("includes hasMask and regional sliders when mask present", () => {
    const recipe = attachPersonMask(recipeWithMain("a"), "mask-a");
    const withRegional = applyRegionalSlider(recipe, "bg_mute", -0.5);
    const ctx = buildRecipeContext(withRegional);
    expect(ctx.hasMask).toBe(true);
    expect(ctx.regionalSliders?.bg_mute).toBeCloseTo(-0.5);
  });

  it("omits regional fields without mask", () => {
    const ctx = buildRecipeContext(recipeWithMain("a"));
    expect(ctx.hasMask).toBeUndefined();
    expect(ctx.regionalSliders).toBeUndefined();
  });
});

describe("normalizeTalkResponse regional", () => {
  it("normalizes delta_regional_slider to set_regional_slider", () => {
    const ctx = maskedCtx();
    const r = normalizeTalkResponse(
      {
        patches: [
          {
            op: "delta_regional_slider",
            region: "background",
            sliderId: "bg_mute",
            delta: -0.2,
          },
        ],
      },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.patches?.[0]).toEqual({
      op: "set_regional_slider",
      region: "background",
      sliderId: "bg_mute",
      value: -0.2,
    });
  });

  it("rejects regional tools without mask (NO_MASK)", () => {
    const ctx = buildRecipeContext(recipeWithMain("a"));
    const r = normalizeTalkResponse(
      {
        patches: [
          {
            op: "set_regional_slider",
            region: "background",
            sliderId: "bg_mute",
            value: -0.8,
          },
        ],
      },
      ctx,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("NO_MASK");
  });

  it("accepts applyRegionalPreset when masked", () => {
    const r = normalizeTalkResponse(
      { applyRegionalPreset: { presetId: "muted_background" } },
      maskedCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.applyRegionalPreset?.presetId).toBe("muted_background");
  });

  it("accepts regenerateMask when masked", () => {
    const r = normalizeTalkResponse({ regenerateMask: true }, maskedCtx());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.regenerateMask).toBe(true);
  });

  it("global sliders still work without mask", () => {
    const ctx = buildRecipeContext(recipeWithMain("a"));
    const r = normalizeTalkResponse(
      { patches: [{ op: "delta_slider", sliderId: "grain", delta: -0.1 }] },
      ctx,
    );
    expect(r.ok).toBe(true);
  });
});

describe("applyTalk regional (F5)", () => {
  it("talk bg_mute ≡ applyRegionalSlider bg_mute", () => {
    const recipe = attachPersonMask(recipeWithMain("main-asset"), "mask-1");
    const viaTalk = applyTalk(recipe, {
      patches: [
        {
          op: "set_regional_slider",
          region: "background",
          sliderId: "bg_mute",
          value: -0.85,
        },
      ],
    });
    const viaSlider = applyRegionalSlider(recipe, "bg_mute", -0.85);
    expect(viaTalk.ok).toBe(true);
    if (!viaTalk.ok) return;
    expect(viaTalk.recipe).toEqual(viaSlider);
  });

  it("applyRegionalPreset maps muted_background", () => {
    const recipe = attachPersonMask(recipeWithMain("main-asset"), "mask-1");
    const result = applyTalk(recipe, {
      applyRegionalPreset: { presetId: "muted_background" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const main = result.recipe.objects.find((o) => o.kind === "image" && o.role === "main");
    const bg = main?.kind === "image" ? main.regional?.background.effects : [];
    const sat = bg?.find((e) => e.id === "saturation");
    expect(sat?.params.amount).toBeCloseTo(-0.85);
  });

  it("regional patch does not clear packId", () => {
    const recipe = attachPersonMask(
      applyPack(recipeWithMain("main-asset"), "warm-film"),
      "mask-1",
    );
    const result = applyTalk(recipe, {
      patches: [
        {
          op: "set_regional_slider",
          region: "subject",
          sliderId: "subject_pop",
          value: 0.3,
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.packId).toBe("warm-film");
  });

  it("regenerateMask-only response succeeds without recipe writes", () => {
    const recipe = attachPersonMask(recipeWithMain("main-asset"), "mask-1");
    const before = JSON.stringify(recipe);
    const result = applyTalk(recipe, { regenerateMask: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.regenerateMask).toBe(true);
    expect(JSON.stringify(result.recipe)).toBe(before);
  });

  it("normalize + apply: mute background preset path", () => {
    const recipe = attachPersonMask(recipeWithMain("main-asset"), "mask-1");
    const ctx = buildRecipeContext(recipe);
    const norm = normalizeTalkResponse(
      { applyRegionalPreset: { presetId: "muted_background" } },
      ctx,
    );
    expect(norm.ok).toBe(true);
    if (!norm.ok) return;
    const applied = applyTalk(recipe, norm.response);
    expect(applied.ok).toBe(true);
  });
});
