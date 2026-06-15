import { beforeEach, describe, expect, it } from "vitest";
import { applyPresetPatch, mergeLayerEffectsPatch } from "@/lib/preset/apply";
import { PresetValidationError } from "@/lib/preset/validate";
import {
  createDefaultLayerEffects,
  createDefaultLayerEffectsMap,
  type LayerEffectParams,
} from "@/store/layerEffects";
import { useSynthStore } from "@/store/useSynthStore";
import { resetSynthStore } from "@/test/resetSynthStore";

const defaults = createDefaultLayerEffects();

function expectLayerMatchesDefaults(layer: LayerEffectParams) {
  for (const key of Object.keys(defaults) as (keyof LayerEffectParams)[]) {
    expect(layer[key]).toBe(defaults[key]);
  }
}

describe("mergeLayerEffectsPatch", () => {
  it("merges partial background patch and leaves decal/text unchanged", () => {
    const current = createDefaultLayerEffectsMap();
    const result = mergeLayerEffectsPatch(current, {
      background: { meltIntensity: 0.5 },
    });

    expect(result.background.meltIntensity).toBe(0.5);
    expectLayerMatchesDefaults(result.decal);
    expectLayerMatchesDefaults(result.text);
  });

  it("returns same reference when patch is undefined", () => {
    const current = createDefaultLayerEffectsMap();
    expect(mergeLayerEffectsPatch(current, undefined)).toBe(current);
  });

  it("returns shallow copy with unchanged layer values for empty patch", () => {
    const current = createDefaultLayerEffectsMap();
    const result = mergeLayerEffectsPatch(current, {});

    expect(result).not.toBe(current);
    expectLayerMatchesDefaults(result.background);
    expectLayerMatchesDefaults(result.decal);
    expectLayerMatchesDefaults(result.text);
  });

  it("throws PresetValidationError for invalid NaN values", () => {
    const current = createDefaultLayerEffectsMap();
    expect(() =>
      mergeLayerEffectsPatch(current, {
        background: { meltIntensity: NaN },
      }),
    ).toThrow(PresetValidationError);
  });
});

describe("applyPresetPatch", () => {
  beforeEach(() => {
    resetSynthStore();
  });

  it("applies layerEffects patch to store without changing decal layer", () => {
    applyPresetPatch({
      layerEffects: { background: { meltIntensity: 0.5 } },
    });

    const { layerEffects } = useSynthStore.getState();
    expect(layerEffects.background.meltIntensity).toBe(0.5);
    expectLayerMatchesDefaults(layerEffects.decal);
  });

  it("does not set imageTexture or decalTexture", () => {
    applyPresetPatch({
      layerEffects: { background: { meltIntensity: 0.5 } },
    });

    const { imageTexture, decalTexture } = useSynthStore.getState();
    expect(imageTexture).toBeNull();
    expect(decalTexture).toBeNull();
  });

  it("throws PresetValidationError for invalid numeric patch", () => {
    const before = useSynthStore.getState().layerEffects;

    expect(() =>
      applyPresetPatch({
        layerEffects: { background: { meltIntensity: NaN } },
      }),
    ).toThrow(PresetValidationError);

    expect(useSynthStore.getState().layerEffects).toEqual(before);
  });
});
