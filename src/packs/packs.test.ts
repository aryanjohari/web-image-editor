import { describe, expect, it } from "vitest";
import { attachPersonMask } from "../masks/segment";
import { recipeWithMain, identityOverlayImage } from "../recipe/identityRecipe";
import { applyPathPatch } from "../recipe/pathPatch";
import { validateRecipe } from "../recipe/validate";
import {
  applyPack,
  applySemanticSlider,
  getPack,
  listPacks,
  PACK_IDS,
  readRegionalSliderValue,
  readSliderValue,
  resetLook,
  scaleEffectsByIntensity,
} from "./index";

describe("packs catalog", () => {
  it("loads exactly 8 M06 packs validated against registry", () => {
    const packs = listPacks();
    expect(packs).toHaveLength(8);
    expect(packs.map((p) => p.id).sort()).toEqual([...PACK_IDS].sort());
    for (const id of PACK_IDS) {
      expect(getPack(id).mainEffects.length).toBeGreaterThan(0);
      expect(getPack(id).family).toBeTruthy();
    }
  });

  it("F3: blur ships in dusk-grain and muted-split defaults", () => {
    const dusk = getPack("dusk-grain");
    const muted = getPack("muted-split");
    const duskBlur = dusk.regionalDefaults?.background?.some((e) => e.id === "blur");
    const mutedBlur = muted.regionalDefaults?.background?.some((e) => e.id === "blur");
    expect(duskBlur).toBe(true);
    expect(mutedBlur).toBe(true);
  });

  it("F5: any two packs differ in at least one mainEffects param", () => {
    const packs = listPacks();
    for (let i = 0; i < packs.length; i++) {
      for (let j = i + 1; j < packs.length; j++) {
        const a = JSON.stringify(packs[i]!.mainEffects);
        const b = JSON.stringify(packs[j]!.mainEffects);
        expect(a).not.toEqual(b);
      }
    }
  });
});

describe("applyPack", () => {
  it("F3: preserves main/overlay asset ids", () => {
    let recipe = recipeWithMain("main-asset-1");
    recipe = validateRecipe({
      ...recipe,
      objects: [...recipe.objects, identityOverlayImage("overlay-asset-1")],
    });
    const next = applyPack(recipe, "editorial-bw");
    const main = next.objects.find((o) => o.kind === "image" && o.role === "main");
    const overlay = next.objects.find((o) => o.kind === "image" && o.role === "overlay");
    expect(main && main.kind === "image" && main.source).toEqual({
      type: "id",
      assetId: "main-asset-1",
    });
    expect(overlay && overlay.kind === "image" && overlay.source).toEqual({
      type: "id",
      assetId: "overlay-asset-1",
    });
    expect(next.packId).toBe("editorial-bw");
    expect(next.packVersion).toBe(getPack("editorial-bw").version);
  });

  it("writes absolute intensity-scaled params (intensity 0 → identity amounts)", () => {
    const recipe = recipeWithMain("main-asset-1");
    const zero = applyPack(recipe, "warm-film", { intensity: 0 });
    const main = zero.objects.find((o) => o.kind === "image" && o.role === "main");
    expect(main && main.kind === "image").toBe(true);
    if (main && main.kind === "image") {
      for (const ef of main.effects) {
        for (const [key, v] of Object.entries(ef.params)) {
          if (typeof v === "number") {
            if (ef.id === "grain" && key === "size") expect(v).toBe(0.5);
            else expect(v).toBe(0);
          } else expect(typeof v).toBe("string");
        }
      }
    }
  });

  it("scaleEffectsByIntensity lerps numeric params", () => {
    const pack = getPack("poster-punch");
    const half = scaleEffectsByIntensity(pack.mainEffects, 0.5);
    const contrast = half.find((e) => e.id === "contrast");
    expect(contrast?.params.amount).toBeCloseTo(0.275);
    const duo = half.find((e) => e.id === "duotone");
    expect(duo?.params.amount).toBeCloseTo(0.275);
    expect(duo?.params.shadow).toBe("#1a1030");
  });

  it("resetLook clears effects and pack provenance", () => {
    const applied = applyPack(recipeWithMain("m1"), "poster-punch");
    const reset = resetLook(applied);
    const main = reset.objects.find((o) => o.kind === "image" && o.role === "main");
    expect(main && main.kind === "image" && main.effects).toEqual([]);
    expect(reset.packId).toBeNull();
    expect(reset.packVersion).toBeNull();
  });

  it("seeds regional stacks from pack regionalDefaults when mask active", () => {
    const masked = attachPersonMask(recipeWithMain("m1"), "mask-1");
    const next = applyPack(masked, "warm-film", { intensity: 1 });
    expect(readRegionalSliderValue(next, "bg_mute")).toBeCloseTo(-0.7);
    expect(readRegionalSliderValue(next, "bg_fade")).toBeCloseTo(0.3);
    expect(readRegionalSliderValue(next, "subject_chroma")).toBeCloseTo(0.1);
    expect(next.packId).toBe("warm-film");
  });

  it("does not seed regional when no mask", () => {
    const next = applyPack(recipeWithMain("m1"), "warm-film");
    const main = next.objects.find((o) => o.kind === "image" && o.role === "main");
    expect(main && main.kind === "image" && main.regional).toBeUndefined();
  });

  it("lerps regionalDefaults by intensity", () => {
    const masked = attachPersonMask(recipeWithMain("m1"), "mask-1");
    const half = applyPack(masked, "warm-film", { intensity: 0.5 });
    expect(readRegionalSliderValue(half, "bg_mute")).toBeCloseTo(-0.35);
  });

  it("applies textHints on poster-punch (creates text if missing)", () => {
    const next = applyPack(recipeWithMain("m1"), "poster-punch");
    const text = next.objects.find((o) => o.kind === "text");
    expect(text && text.kind === "text").toBe(true);
    if (text && text.kind === "text") {
      expect(text.transform.y).toBeLessThan(0);
      expect(text.text.fontWeight).toBe(700);
    }
  });
});

describe("semantic sliders", () => {
  it("F2: slider writes PathPatch path into recipe", () => {
    const base = recipeWithMain("m1");
    const next = applySemanticSlider(base, "contrast", 0.42);
    const main = next.objects.find((o) => o.kind === "image" && o.role === "main");
    expect(main && main.kind === "image").toBe(true);
    if (main && main.kind === "image") {
      const contrast = main.effects.find((e) => e.id === "contrast");
      expect(contrast?.params.amount).toBeCloseTo(0.42);
    }
  });

  it("blur and grain_size PathPatch identity", () => {
    let r = applySemanticSlider(recipeWithMain("m1"), "blur", 0.4);
    expect(readSliderValue(r, "blur")).toBeCloseTo(0.4);
    r = applySemanticSlider(r, "grain_size", 0.7);
    expect(readSliderValue(r, "grain_size")).toBeCloseTo(0.7);
    const main = r.objects.find((o) => o.kind === "image" && o.role === "main");
    expect(main && main.kind === "image" && main.effects.some((e) => e.id === "blur")).toBe(
      true,
    );
  });

  it("F4: illegal PathPatch / OOR rejected", () => {
    const base = applySemanticSlider(recipeWithMain("m1"), "grain", 0.2);
    expect(() =>
      applyPathPatch(base, [
        { path: "/objects/main/effects/0/params/amount", value: 9 },
      ]),
    ).toThrow();
    expect(() =>
      applyPathPatch(base, [{ path: "/objects/main/effects/0/id", value: "blur" }]),
    ).toThrow();
  });
});
