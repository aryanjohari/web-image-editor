import { describe, expect, it } from "vitest";
import { FORMULA_CATALOG, getFormulaById } from "@/data/formulaCatalog";
import type { LayerEffectParams } from "@/store/layerEffects";

const LAYER_EFFECT_KEYS = new Set<string>([
  "meltIntensity",
  "colorBleed",
  "noiseLevel",
  "posterizeSteps",
  "timeScale",
  "maskCenterX",
  "maskCenterY",
  "maskRadius",
  "twirlIntensity",
  "colorA",
  "colorB",
  "duotoneBlend",
  "colorCycleSpeed",
  "halftoneIntensity",
  "scanlineIntensity",
]);

describe("FORMULA_CATALOG", () => {
  it("has at least 8 entries", () => {
    expect(FORMULA_CATALOG.length).toBeGreaterThanOrEqual(8);
  });

  it("maps every param to a valid LayerEffectParams key", () => {
    for (const entry of FORMULA_CATALOG) {
      expect(LAYER_EFFECT_KEYS.has(entry.param)).toBe(true);
      const _typeCheck: keyof LayerEffectParams = entry.param;
      expect(_typeCheck).toBe(entry.param);
    }
  });

  it("has min < max for every entry", () => {
    for (const entry of FORMULA_CATALOG) {
      expect(entry.min).toBeLessThan(entry.max);
    }
  });

  it("has no duplicate ids", () => {
    const ids = FORMULA_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes every category at least once", () => {
    const categories = new Set(FORMULA_CATALOG.map((e) => e.category));
    expect(categories.has("warp")).toBe(true);
    expect(categories.has("shade")).toBe(true);
    expect(categories.has("composite")).toBe(true);
  });
});

describe("getFormulaById", () => {
  it("returns entry by id", () => {
    expect(getFormulaById("melt")?.param).toBe("meltIntensity");
    expect(getFormulaById("missing")).toBeUndefined();
  });
});
