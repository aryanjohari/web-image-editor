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

  it("covers all four slider ids", () => {
    expect(REGIONAL_SLIDERS).toHaveLength(4);
    for (const spec of REGIONAL_SLIDERS) {
      const next = applyRegionalSlider(base, spec.id, spec.min);
      expect(readRegionalSliderValue(next, spec.id)).toBe(spec.min);
    }
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
