import { describe, expect, it } from "vitest";
import { recipeWithMain, identityOverlayImage } from "../recipe/identityRecipe";
import { applyPathPatch } from "../recipe/pathPatch";
import { validateRecipe } from "../recipe/validate";
import {
  applyPack,
  applySemanticSlider,
  getPack,
  listPacks,
  PACK_IDS,
  resetLook,
  scaleEffectsByIntensity,
} from "./index";

describe("packs catalog", () => {
  it("loads exactly 3 Tier A packs validated against registry", () => {
    const packs = listPacks();
    expect(packs.map((p) => p.id).sort()).toEqual([...PACK_IDS].sort());
    for (const id of PACK_IDS) {
      expect(getPack(id).mainEffects.length).toBeGreaterThan(0);
    }
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
        for (const v of Object.values(ef.params)) {
          if (typeof v === "number") expect(v).toBe(0);
          else expect(typeof v).toBe("string");
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
