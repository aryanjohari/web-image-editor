import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDEA_GLITCH } from "@/data/demoIdeasPresets";
import {
  applyEffectsOnlyFromPreset,
  applyPresetPatch,
  applyStylePreset,
  mergeLayerEffectsPatch,
} from "@/lib/preset/apply";
import {
  getPreserveTextOnApply,
  setPreserveTextOnApply,
} from "@/lib/preset/presetApplyPreference";
import { PresetValidationError } from "@/lib/preset/validate";
import {
  createDefaultLayerEffects,
  createDefaultLayerEffectsMap,
  type LayerEffectParams,
} from "@/store/layerEffects";
import { createTextLayer } from "@/store/textLayers";
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

describe("applyEffectsOnlyFromPreset", () => {
  beforeEach(() => {
    resetSynthStore();
  });

  it("updates layerEffects from preset", () => {
    applyEffectsOnlyFromPreset(IDEA_GLITCH);

    const { layerEffects } = useSynthStore.getState();
    expect(layerEffects.background.meltIntensity).toBe(0.72);
  });

  it("does not change textLayers when store had custom text", () => {
    const custom = createTextLayer({ id: "custom-1", text: "MY COPY" });
    useSynthStore.getState().setTextLayers([custom]);
    useSynthStore.getState().setSelectedTextLayerId("custom-1");

    applyEffectsOnlyFromPreset(IDEA_GLITCH);

    const { textLayers, selectedTextLayerId } = useSynthStore.getState();
    expect(textLayers).toHaveLength(1);
    expect(textLayers[0]?.text).toBe("MY COPY");
    expect(selectedTextLayerId).toBe("custom-1");
  });

  it("does not set imageTexture or decalTexture", () => {
    applyEffectsOnlyFromPreset(IDEA_GLITCH);

    const { imageTexture, decalTexture } = useSynthStore.getState();
    expect(imageTexture).toBeNull();
    expect(decalTexture).toBeNull();
  });
});

describe("applyStylePreset preserveText", () => {
  beforeEach(() => {
    resetSynthStore();
  });

  it("with preserveText: false replaces text layers", () => {
    const custom = createTextLayer({ id: "custom-1", text: "MY COPY" });
    useSynthStore.getState().setTextLayers([custom]);

    applyStylePreset(IDEA_GLITCH, { preserveText: false });

    const { textLayers } = useSynthStore.getState();
    expect(textLayers[0]?.text).toBe("GLITCH CORE");
  });

  it("with preserveText: true keeps custom text", () => {
    const custom = createTextLayer({ id: "custom-1", text: "MY COPY" });
    useSynthStore.getState().setTextLayers([custom]);

    applyStylePreset(IDEA_GLITCH, { preserveText: true });

    const { textLayers } = useSynthStore.getState();
    expect(textLayers[0]?.text).toBe("MY COPY");
  });
});

describe("presetApplyPreference", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to true when unset", () => {
    expect(getPreserveTextOnApply()).toBe(true);
  });

  it("round-trips set and get", () => {
    setPreserveTextOnApply(false);
    expect(getPreserveTextOnApply()).toBe(false);
    setPreserveTextOnApply(true);
    expect(getPreserveTextOnApply()).toBe(true);
  });
});
