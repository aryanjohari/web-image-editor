import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEMANTIC,
  semanticSlidersToPatch,
} from "@/lib/semantic/mapSemanticSliders";

describe("semanticSlidersToPatch", () => {
  it("maps minimum sliders to documented minima", () => {
    const { layerEffects } = semanticSlidersToPatch({
      intensity: 0,
      motion: 0,
      grit: 0,
    });
    const bg = layerEffects?.background;

    expect(bg?.meltIntensity).toBe(0);
    expect(bg?.colorBleed).toBe(0);
    expect(bg?.duotoneBlend).toBe(0);
    expect(bg?.timeScale).toBe(0.25);
    expect(bg?.colorCycleSpeed).toBe(0);
    expect(bg?.noiseLevel).toBe(0);
    expect(bg?.scanlineIntensity).toBe(0);
    expect(bg?.halftoneIntensity).toBe(0);
    expect(bg?.posterizeSteps).toBe(16);
  });

  it("maps maximum sliders to documented maxima", () => {
    const { layerEffects } = semanticSlidersToPatch({
      intensity: 1,
      motion: 1,
      grit: 1,
    });
    const bg = layerEffects?.background;

    expect(bg?.meltIntensity).toBe(0.75);
    expect(bg?.colorBleed).toBe(0.85);
    expect(bg?.duotoneBlend).toBe(0.65);
    expect(bg?.timeScale).toBe(2.5);
    expect(bg?.colorCycleSpeed).toBe(2.8);
    expect(bg?.noiseLevel).toBe(0.22);
    expect(bg?.scanlineIntensity).toBe(0.45);
    expect(bg?.halftoneIntensity).toBe(0.35);
    expect(bg?.posterizeSteps).toBe(4);
  });

  it("maps DEFAULT_SEMANTIC to intermediate values", () => {
    const { layerEffects } = semanticSlidersToPatch(DEFAULT_SEMANTIC);
    const bg = layerEffects?.background;

    expect(bg?.meltIntensity).toBeCloseTo(0.2625);
    expect(bg?.colorBleed).toBeCloseTo(0.2975);
    expect(bg?.duotoneBlend).toBeCloseTo(0.2275);
    expect(bg?.timeScale).toBeCloseTo(1.15);
    expect(bg?.colorCycleSpeed).toBeCloseTo(1.12);
    expect(bg?.noiseLevel).toBeCloseTo(0.044);
    expect(bg?.scanlineIntensity).toBeCloseTo(0.09);
    expect(bg?.halftoneIntensity).toBeCloseTo(0.07);
    expect(bg?.posterizeSteps).toBeCloseTo(13.6);
  });
});
