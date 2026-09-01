import { describe, expect, it } from "vitest";
import { attachPersonMask } from "../masks/segment";
import {
  applyRegionalSlider,
  readRegionalSliderValue,
  REGIONAL_SLIDERS,
} from "./regionalSliders";
import { recipeWithMain } from "../recipe/identityRecipe";
import { applyPathPatch } from "../recipe/pathPatch";

describe("regionalSliders", () => {
  const base = attachPersonMask(recipeWithMain("photo-1"), "mask-1");

  it("maps bg_mute to background saturation path", () => {
    const next = applyRegionalSlider(base, "bg_mute", -0.85);
    expect(readRegionalSliderValue(next, "bg_mute")).toBe(-0.85);
    const main = next.objects.find((o) => o.kind === "image" && o.role === "main");
    const bg = main?.kind === "image" ? main.regional?.background.effects : [];
    const sat = bg?.find((e) => e.id === "saturation");
    expect(sat?.params.amount).toBe(-0.85);
  });

  it("maps subject_pop to subject contrast", () => {
    const next = applyRegionalSlider(base, "subject_pop", 0.35);
    expect(readRegionalSliderValue(next, "subject_pop")).toBe(0.35);
  });

  it("covers all five regional slider ids", () => {
    expect(REGIONAL_SLIDERS).toHaveLength(5);
    for (const spec of REGIONAL_SLIDERS) {
      const next = applyRegionalSlider(base, spec.id, spec.min);
      expect(readRegionalSliderValue(next, spec.id)).toBe(spec.min);
    }
  });

  it("maps bg_blur to background blur amount", () => {
    const next = applyRegionalSlider(base, "bg_blur", 0.45);
    expect(readRegionalSliderValue(next, "bg_blur")).toBe(0.45);
  });
});

describe("regional PathPatch allowlist", () => {
  it("patches regional paths when allowlisted", () => {
    const base = attachPersonMask(recipeWithMain("a"), "mask-a");
    const withFx = applyRegionalSlider(base, "bg_fade", 0.4);
    const next = applyPathPatch(withFx, [
      {
        path: "/objects/main/regional/background/effects/0/params/amount",
        value: 0.55,
      },
    ]);
    expect(readRegionalSliderValue(next, "bg_fade")).toBe(0.55);
  });
});
