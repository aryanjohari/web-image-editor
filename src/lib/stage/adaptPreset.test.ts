import { describe, expect, it } from "vitest";
import { IDEA_GLITCH } from "@/data/demoIdeasPresets";
import { PRESET_CATALOG } from "@/data/presetCatalog";
import { createTextLayer } from "@/store/textLayers";
import { makeIdeaPreset } from "@/data/presetBuilders";
import {
  STAGE_BG_ASSET_ID,
  STAGE_DECAL_ASSET_ID,
  stageRecipeToSynthPresetV2,
  synthPresetV2ToStageRecipe,
  type StageRecipeWithV2Compat,
} from "./adaptPreset";
import { parseStageRecipe } from "./parse";
import { STAGE_RECIPE_SCHEMA_VERSION } from "./types";

describe("synthPresetV2ToStageRecipe", () => {
  it("maps catalog glitch look to schema v3 with image + decal + text layers", () => {
    const recipe = synthPresetV2ToStageRecipe(IDEA_GLITCH);
    expect(recipe.recipeSchemaVersion).toBe(STAGE_RECIPE_SCHEMA_VERSION);
    expect(recipe.engineVersion).toBe(IDEA_GLITCH.engineVersion);
    expect(recipe.baseTimeSeconds).toBe(IDEA_GLITCH.baseTimeSeconds);
    expect(recipe.viewport).toEqual(IDEA_GLITCH.viewport);

    const image = recipe.layers.find((l) => l.type === "image");
    const decal = recipe.layers.find((l) => l.type === "decal");
    const text = recipe.layers.filter((l) => l.type === "text");
    expect(image).toBeDefined();
    expect(decal).toBeDefined();
    expect(text).toHaveLength(1);
    expect(text[0]!.text).toBe("GLITCH CORE");
    expect(image!.effects.meltIntensity).toBe(IDEA_GLITCH.layerEffects.background.meltIntensity);
    expect(decal!.transform.scale).toBe(IDEA_GLITCH.synth.decalScale);
    expect(parseStageRecipe(recipe).ok).toBe(true);
  });

  it("embeds background and decal assets when present", () => {
    const preset = structuredClone(IDEA_GLITCH);
    preset.assets = {
      background: { mime: "image/png", dataBase64: "AAA" },
      decal: { mime: "image/png", dataBase64: "BBB" },
    };
    const recipe = synthPresetV2ToStageRecipe(preset);
    expect(recipe.assets[STAGE_BG_ASSET_ID]?.dataBase64).toBe("AAA");
    expect(recipe.assets[STAGE_DECAL_ASSET_ID]?.dataBase64).toBe("BBB");
    expect(recipe.assets[STAGE_BG_ASSET_ID]?.kind).toBe("image");
    expect(recipe.assets[STAGE_DECAL_ASSET_ID]?.kind).toBe("decal");
  });

  it("maps multiple text layers and private effects", () => {
    const a = createTextLayer({
      id: "t1",
      text: "ONE",
      effectsLinked: true,
      offsetX: 0.1,
    });
    const b = createTextLayer({
      id: "t2",
      text: "TWO",
      effectsLinked: false,
      offsetY: -0.2,
    });
    const preset = makeIdeaPreset(
      {
        decalScale: 1.2,
        decalOffsetX: 0.05,
        decalOffsetY: -0.05,
        decalBackgroundLumaMask: 0.4,
        linkDecalToMath: true,
        linkTextToMath: false,
        textLayers: [a, b],
        selectedTextLayerId: "t2",
        textLayerEffects: {
          t2: {
            meltIntensity: 0.9,
            colorBleed: 0.1,
            noiseLevel: 0.02,
            posterizeSteps: 4,
            timeScale: 2,
            maskCenterX: 0.5,
            maskCenterY: 0.5,
            maskRadius: 0.5,
            twirlIntensity: 0,
            colorA: "#111111",
            colorB: "#eeeeee",
            duotoneBlend: 0.3,
            colorCycleSpeed: 0,
            halftoneIntensity: 0,
            scanlineIntensity: 0.2,
          },
        },
      },
      { background: { meltIntensity: 0.44 } },
    );

    const recipe = synthPresetV2ToStageRecipe(preset);
    const texts = recipe.layers.filter((l) => l.type === "text");
    expect(texts).toHaveLength(2);
    const t2 = texts.find((l) => l.id === "t2")!;
    expect(t2.effectsLinked).toBe(false);
    expect(t2.effects.meltIntensity).toBe(0.9);
    expect(t2.transform.offsetY).toBe(-0.2);
  });

  it("handles missing assets without inventing asset entries", () => {
    const recipe = synthPresetV2ToStageRecipe(IDEA_GLITCH);
    expect(Object.keys(recipe.assets)).toHaveLength(0);
    expect(recipe.layers.some((l) => l.type === "image")).toBe(true);
    expect(recipe.layers.some((l) => l.type === "decal")).toBe(true);
  });
});

describe("stageRecipeToSynthPresetV2", () => {
  it("round-trips IDEA_GLITCH critical fields", () => {
    const recipe = synthPresetV2ToStageRecipe(IDEA_GLITCH);
    const back = stageRecipeToSynthPresetV2(recipe);

    expect(back.presetSchemaVersion).toBe(2);
    expect(back.engineVersion).toBe(IDEA_GLITCH.engineVersion);
    expect(back.baseTimeSeconds).toBe(IDEA_GLITCH.baseTimeSeconds);
    expect(back.viewport).toEqual(IDEA_GLITCH.viewport);
    expect(back.imageResolution).toEqual(IDEA_GLITCH.imageResolution);
    expect(back.layerEffects.background.meltIntensity).toBe(
      IDEA_GLITCH.layerEffects.background.meltIntensity,
    );
    expect(back.layerEffects.decal.halftoneIntensity).toBe(
      IDEA_GLITCH.layerEffects.decal.halftoneIntensity,
    );
    expect(back.layerEffects.text.meltIntensity).toBe(IDEA_GLITCH.layerEffects.text.meltIntensity);
    expect(back.synth.decalScale).toBe(IDEA_GLITCH.synth.decalScale);
    expect(back.synth.decalOffsetX).toBe(IDEA_GLITCH.synth.decalOffsetX);
    expect(back.synth.decalOffsetY).toBe(IDEA_GLITCH.synth.decalOffsetY);
    expect(back.synth.linkDecalToMath).toBe(IDEA_GLITCH.synth.linkDecalToMath);
    expect(back.synth.linkTextToMath).toBe(IDEA_GLITCH.synth.linkTextToMath);
    expect(back.synth.decalBackgroundLumaMask).toBe(IDEA_GLITCH.synth.decalBackgroundLumaMask);
    expect(back.synth.textLayers).toHaveLength(1);
    expect(back.synth.textLayers[0]!.text).toBe(IDEA_GLITCH.synth.textLayers[0]!.text);
    expect(back.synth.selectedTextLayerId).toBe(IDEA_GLITCH.synth.selectedTextLayerId);
    expect(back.assets).toBeUndefined();
  });

  it("round-trips embedded assets", () => {
    const preset = structuredClone(IDEA_GLITCH);
    preset.assets = {
      background: { mime: "image/png", dataBase64: "bgdata" },
      decal: { mime: "image/webp", dataBase64: "decaldata" },
    };
    const back = stageRecipeToSynthPresetV2(synthPresetV2ToStageRecipe(preset));
    expect(back.assets?.background?.dataBase64).toBe("bgdata");
    expect(back.assets?.decal?.dataBase64).toBe("decaldata");
    expect(back.assets?.decal?.mime).toBe("image/webp");
  });

  it("round-trips catalog presets for critical fields", () => {
    for (const entry of PRESET_CATALOG) {
      const recipe = synthPresetV2ToStageRecipe(entry.preset);
      const back = stageRecipeToSynthPresetV2(recipe);
      expect(back.synth.decalScale, entry.id).toBe(entry.preset.synth.decalScale);
      expect(back.layerEffects.background.meltIntensity, entry.id).toBe(
        entry.preset.layerEffects.background.meltIntensity,
      );
      expect(back.synth.textLayers.map((t) => t.text), entry.id).toEqual(
        entry.preset.synth.textLayers.map((t) => t.text),
      );
      expect(back.viewport, entry.id).toEqual(entry.preset.viewport);
    }
  });

  it("uses primary image asset when multiple image layers exist", () => {
    const recipe: StageRecipeWithV2Compat = synthPresetV2ToStageRecipe(IDEA_GLITCH);
    recipe.assets = {
      asset_a: { id: "asset_a", kind: "image", mime: "image/png", dataBase64: "AAAA" },
      asset_b: { id: "asset_b", kind: "image", mime: "image/png", dataBase64: "BBBB" },
    };
    recipe.layers = [
      {
        type: "image",
        id: "img_a",
        assetId: "asset_a",
        transform: { offsetX: 0, offsetY: 0, scale: 1 },
        effects: recipe.layers.find((l) => l.type === "image")!.effects,
        zIndex: 0,
      },
      {
        type: "image",
        id: "img_b",
        assetId: "asset_b",
        transform: { offsetX: 0, offsetY: 0, scale: 1 },
        effects: recipe.layers.find((l) => l.type === "image")!.effects,
        zIndex: 2,
      },
      ...recipe.layers.filter((l) => l.type !== "image"),
    ];

    const asB = stageRecipeToSynthPresetV2(recipe, { primaryImageAssetId: "asset_b" });
    expect(asB.assets?.background?.dataBase64).toBe("BBBB");

    const asDefault = stageRecipeToSynthPresetV2(recipe);
    expect(asDefault.assets?.background?.dataBase64).toBe("AAAA");
  });

  it("tolerates missing assets on image/decal layers", () => {
    const recipe = synthPresetV2ToStageRecipe(IDEA_GLITCH);
    const back = stageRecipeToSynthPresetV2(recipe);
    expect(back.assets).toBeUndefined();
    expect(back.layerEffects.background.meltIntensity).toBe(
      IDEA_GLITCH.layerEffects.background.meltIntensity,
    );
  });
});
