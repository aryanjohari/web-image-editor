/**
 * Phase 1 — bidirectional adaptor between SynthPreset v2 (runtime) and StageRecipe (product).
 *
 * GPU compositor remains L0 (hero) + L1 (decal) + text slots. Recipes may describe N image
 * layers; only the primary image + first decal apply to v2 assets / GPU.
 */

import { PRESET_SCHEMA_VERSION, type SynthPresetV2 } from "@/lib/preset/types";
import {
  createDefaultLayerEffects,
  createDefaultLayerEffectsMap,
  type LayerEffectParams,
} from "@/store/layerEffects";
import { MAX_TEXT_LAYERS, type TextLayer } from "@/store/textLayers";
import {
  STAGE_RECIPE_SCHEMA_VERSION,
  type StageAssetRef,
  type StageDecalLayer,
  type StageImageLayer,
  type StageLayer,
  type StageLayerEffects,
  type StageLayerTransform,
  type StageRecipe,
  type StageTextLayer,
} from "./types";

function defaultTransform(): StageLayerTransform {
  return { offsetX: 0, offsetY: 0, scale: 1, rotationDeg: 0 };
}

/** Stable asset ids used when mapping the two v2 slots. */
export const STAGE_BG_ASSET_ID = "asset_background" as const;
export const STAGE_DECAL_ASSET_ID = "asset_decal" as const;

/**
 * Compositor fields with no StageRecipe home yet — carried for round-trip only.
 * Stripped by consumers that only care about the product contract.
 */
export type StageRecipeV2Compat = {
  linkDecalToMath: boolean;
  linkTextToMath: boolean;
  decalBackgroundLumaMask: number;
  selectedTextLayerId: string;
  imageResolution: { width: number; height: number };
};

export type StageRecipeWithV2Compat = StageRecipe & {
  _v2Compat?: StageRecipeV2Compat;
};

function effectsToStage(fx: LayerEffectParams): StageLayerEffects {
  return {
    meltIntensity: fx.meltIntensity,
    colorBleed: fx.colorBleed,
    noiseLevel: fx.noiseLevel,
    posterizeSteps: fx.posterizeSteps,
    timeScale: fx.timeScale,
    maskCenterX: fx.maskCenterX,
    maskCenterY: fx.maskCenterY,
    maskRadius: fx.maskRadius,
    twirlIntensity: fx.twirlIntensity,
    colorA: fx.colorA,
    colorB: fx.colorB,
    duotoneBlend: fx.duotoneBlend,
    colorCycleSpeed: fx.colorCycleSpeed,
    halftoneIntensity: fx.halftoneIntensity,
    scanlineIntensity: fx.scanlineIntensity,
  };
}

function effectsFromStage(fx: StageLayerEffects): LayerEffectParams {
  return {
    meltIntensity: fx.meltIntensity,
    colorBleed: fx.colorBleed,
    noiseLevel: fx.noiseLevel,
    posterizeSteps: fx.posterizeSteps,
    timeScale: fx.timeScale,
    maskCenterX: fx.maskCenterX,
    maskCenterY: fx.maskCenterY,
    maskRadius: fx.maskRadius,
    twirlIntensity: fx.twirlIntensity,
    colorA: fx.colorA,
    colorB: fx.colorB,
    duotoneBlend: fx.duotoneBlend,
    colorCycleSpeed: fx.colorCycleSpeed,
    halftoneIntensity: fx.halftoneIntensity,
    scanlineIntensity: fx.scanlineIntensity,
  };
}

function embeddedToAssetRef(
  id: string,
  kind: StageAssetRef["kind"],
  embedded: { mime: string; dataBase64: string },
): StageAssetRef {
  return {
    id,
    kind,
    mime: embedded.mime,
    dataBase64: embedded.dataBase64,
  };
}

function assetRefToEmbedded(
  ref: StageAssetRef | undefined,
): { mime: string; dataBase64: string } | undefined {
  if (!ref?.dataBase64) return undefined;
  return {
    mime: ref.mime ?? "image/png",
    dataBase64: ref.dataBase64,
  };
}

function sortByZ(layers: StageLayer[]): StageLayer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
}

/**
 * Convert a runtime SynthPreset v2 into a StageRecipe (schema v3).
 * Maps background → image layer, decal → decal layer, textLayers → text layers.
 */
export function synthPresetV2ToStageRecipe(preset: SynthPresetV2): StageRecipeWithV2Compat {
  const assets: Record<string, StageAssetRef> = {};
  const layers: StageLayer[] = [];

  const bgEmbedded = preset.assets?.background;
  if (bgEmbedded?.dataBase64) {
    assets[STAGE_BG_ASSET_ID] = embeddedToAssetRef(STAGE_BG_ASSET_ID, "image", bgEmbedded);
  }

  const imageLayer: StageImageLayer = {
    type: "image",
    id: "layer_background",
    assetId: STAGE_BG_ASSET_ID,
    transform: defaultTransform(),
    effects: effectsToStage(preset.layerEffects.background),
    zIndex: 0,
    visible: true,
  };
  layers.push(imageLayer);

  const decalEmbedded = preset.assets?.decal;
  if (decalEmbedded?.dataBase64) {
    assets[STAGE_DECAL_ASSET_ID] = embeddedToAssetRef(STAGE_DECAL_ASSET_ID, "decal", decalEmbedded);
  }

  const decalLayer: StageDecalLayer = {
    type: "decal",
    id: "layer_decal",
    assetId: STAGE_DECAL_ASSET_ID,
    transform: {
      offsetX: preset.synth.decalOffsetX,
      offsetY: preset.synth.decalOffsetY,
      scale: preset.synth.decalScale,
      rotationDeg: 0,
    },
    effects: effectsToStage(preset.layerEffects.decal),
    linkEffectsToBackground: false,
    zIndex: 1,
    visible: true,
  };
  layers.push(decalLayer);

  const masterTextFx = effectsToStage(preset.layerEffects.text);
  preset.synth.textLayers.forEach((tl, index) => {
    const privateFx = preset.synth.textLayerEffects[tl.id];
    const textLayer: StageTextLayer = {
      type: "text",
      id: tl.id,
      text: tl.text,
      color: tl.color,
      fontSize: tl.fontSize,
      transform: {
        offsetX: tl.offsetX,
        offsetY: tl.offsetY,
        scale: tl.scale,
        rotationDeg: 0,
      },
      effects: tl.effectsLinked || !privateFx ? masterTextFx : effectsToStage(privateFx),
      effectsLinked: tl.effectsLinked,
      zIndex: 10 + index,
      visible: true,
    };
    layers.push(textLayer);
  });

  const recipe: StageRecipeWithV2Compat = {
    recipeSchemaVersion: STAGE_RECIPE_SCHEMA_VERSION,
    engineVersion: preset.engineVersion,
    layers,
    assets,
    viewport: { ...preset.viewport },
    baseTimeSeconds: preset.baseTimeSeconds,
    _v2Compat: {
      linkDecalToMath: preset.synth.linkDecalToMath,
      linkTextToMath: preset.synth.linkTextToMath,
      decalBackgroundLumaMask: preset.synth.decalBackgroundLumaMask ?? 0,
      selectedTextLayerId: preset.synth.selectedTextLayerId,
      imageResolution: { ...preset.imageResolution },
    },
  };

  return recipe;
}

export type StageRecipeToV2Options = {
  /**
   * When recipe has multiple image layers, which asset id becomes the GPU hero.
   * Defaults to the lowest-zIndex image layer's assetId (or STAGE_BG_ASSET_ID).
   */
  primaryImageAssetId?: string;
  /** Which asset id becomes the GPU decal. Defaults to first decal layer's assetId. */
  primaryDecalAssetId?: string;
};

/**
 * Convert StageRecipe → SynthPreset v2 for apply/hydrate.
 * Extra image layers beyond the primary hero are omitted from v2 assets (still listed on the recipe).
 */
export function stageRecipeToSynthPresetV2(
  recipe: StageRecipe,
  options?: StageRecipeToV2Options,
): SynthPresetV2 {
  const compat = (recipe as StageRecipeWithV2Compat)._v2Compat;
  const sorted = sortByZ(recipe.layers);

  const imageLayers = sorted.filter((l): l is StageImageLayer => l.type === "image");
  const decalLayers = sorted.filter((l): l is StageDecalLayer => l.type === "decal");
  const textLayersIn = sorted.filter((l): l is StageTextLayer => l.type === "text");

  const primaryImage =
    imageLayers.find((l) => l.assetId === options?.primaryImageAssetId) ?? imageLayers[0];
  const primaryDecal =
    decalLayers.find((l) => l.assetId === options?.primaryDecalAssetId) ?? decalLayers[0];

  const layerEffects = createDefaultLayerEffectsMap();
  if (primaryImage) {
    layerEffects.background = effectsFromStage(primaryImage.effects);
  }
  if (primaryDecal) {
    layerEffects.decal = effectsFromStage(primaryDecal.effects);
  }

  const textLayers: TextLayer[] = [];
  const textLayerEffects: Record<string, LayerEffectParams> = {};
  let masterTextFx = createDefaultLayerEffects();

  const capped = textLayersIn.slice(0, MAX_TEXT_LAYERS);
  for (const tl of capped) {
    if (tl.effectsLinked !== false) {
      masterTextFx = effectsFromStage(tl.effects);
      break;
    }
  }
  layerEffects.text = masterTextFx;

  for (const tl of capped) {
    const effectsLinked = tl.effectsLinked !== false;
    textLayers.push({
      id: tl.id,
      text: tl.text,
      color: tl.color,
      fontSize: tl.fontSize,
      offsetX: tl.transform.offsetX,
      offsetY: tl.transform.offsetY,
      scale: tl.transform.scale,
      effectsLinked,
    });
    if (!effectsLinked) {
      textLayerEffects[tl.id] = effectsFromStage(tl.effects);
    }
  }

  if (textLayers.length === 0) {
    // Match engine bootstrap: at least one empty text slot is fine for apply.
  }

  const bgAssetId = primaryImage?.assetId ?? STAGE_BG_ASSET_ID;
  const decalAssetId = primaryDecal?.assetId ?? STAGE_DECAL_ASSET_ID;
  const bgEmbedded = assetRefToEmbedded(recipe.assets[bgAssetId]);
  const decalEmbedded = assetRefToEmbedded(recipe.assets[decalAssetId]);

  const assets: SynthPresetV2["assets"] =
    bgEmbedded || decalEmbedded
      ? {
          ...(bgEmbedded ? { background: bgEmbedded } : {}),
          ...(decalEmbedded ? { decal: decalEmbedded } : {}),
        }
      : undefined;

  const selectedFromCompat = compat?.selectedTextLayerId;
  const selectedTextLayerId =
    selectedFromCompat && textLayers.some((l) => l.id === selectedFromCompat)
      ? selectedFromCompat
      : (textLayers[0]?.id ?? "");

  const imageResolution =
    compat?.imageResolution ??
    (primaryImage && recipe.assets[primaryImage.assetId]?.width && recipe.assets[primaryImage.assetId]?.height
      ? {
          width: recipe.assets[primaryImage.assetId].width!,
          height: recipe.assets[primaryImage.assetId].height!,
        }
      : { width: recipe.viewport.drawBufferWidth, height: recipe.viewport.drawBufferHeight });

  return {
    presetSchemaVersion: PRESET_SCHEMA_VERSION,
    engineVersion: recipe.engineVersion,
    synth: {
      decalScale: primaryDecal?.transform.scale ?? 1,
      decalOffsetX: primaryDecal?.transform.offsetX ?? 0,
      decalOffsetY: primaryDecal?.transform.offsetY ?? 0,
      decalBackgroundLumaMask: compat?.decalBackgroundLumaMask ?? 0,
      linkDecalToMath: compat?.linkDecalToMath ?? false,
      linkTextToMath: compat?.linkTextToMath ?? false,
      textLayers,
      selectedTextLayerId,
      textLayerEffects,
    },
    layerEffects,
    imageResolution,
    viewport: { ...recipe.viewport },
    baseTimeSeconds: recipe.baseTimeSeconds,
    ...(assets ? { assets } : {}),
  };
}

/** Merge additional Stage assets/layers into a recipe (lab multi-asset). */
export function mergeStageAssetsIntoRecipe(
  recipe: StageRecipeWithV2Compat,
  extraAssets: Record<string, StageAssetRef>,
  extraLayers: StageLayer[] = [],
): StageRecipeWithV2Compat {
  return {
    ...recipe,
    assets: { ...recipe.assets, ...extraAssets },
    layers: [...recipe.layers, ...extraLayers],
  };
}
