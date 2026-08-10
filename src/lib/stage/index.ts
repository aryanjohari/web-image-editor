/**
 * Defaults aligned with engine LayerEffectParams — Phase 0 freeze helpers.
 * Runtime wiring lands in Phase 1.
 */

import type { StageBrandKit, StageFeatureFlags, StageLayerEffects, StageLayerTransform } from "./types";

export function createDefaultStageLayerEffects(): StageLayerEffects {
  return {
    meltIntensity: 0.15,
    colorBleed: 0.2,
    noiseLevel: 0.04,
    posterizeSteps: 8,
    timeScale: 1.0,
    maskCenterX: 0.5,
    maskCenterY: 0.5,
    maskRadius: 0.5,
    twirlIntensity: 0.0,
    colorA: "#000000",
    colorB: "#ffffff",
    duotoneBlend: 0.0,
    colorCycleSpeed: 0,
    halftoneIntensity: 0,
    scanlineIntensity: 0,
  };
}

export function createDefaultStageTransform(): StageLayerTransform {
  return { offsetX: 0, offsetY: 0, scale: 1, rotationDeg: 0 };
}

export function createEmptyBrandKit(
  partial: Pick<StageBrandKit, "id" | "name"> & Partial<Omit<StageBrandKit, "id" | "name">>,
): StageBrandKit {
  return {
    id: partial.id,
    name: partial.name,
    voiceNotes: partial.voiceNotes,
    colors: partial.colors ?? [],
    fonts: partial.fonts ?? [],
    logoAssetId: partial.logoAssetId,
    limits: partial.limits,
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
  };
}

/** Documented defaults — real env wiring in Phase 2/6. */
export const STAGE_DEFAULT_FEATURE_FLAGS: StageFeatureFlags = {
  plateGenerationEnabled: false,
  llmStateOperatorEnabled: true,
};

export { STAGE_PACK_PROFILES, STAGE_DEFAULT_PACK_PROFILE_IDS, getPackProfile, listStillPackProfiles } from "./packProfiles";
export type { StagePackProfile, StageDefaultPackProfileId } from "./packProfiles";
export type * from "./types";
export {
  synthPresetV2ToStageRecipe,
  stageRecipeToSynthPresetV2,
  mergeStageAssetsIntoRecipe,
  STAGE_BG_ASSET_ID,
  STAGE_DECAL_ASSET_ID,
} from "./adaptPreset";
export type { StageRecipeV2Compat, StageRecipeWithV2Compat, StageRecipeToV2Options } from "./adaptPreset";
export { parseBrandKit, parseStageRecipe, parseJobRequest } from "./parse";
export type { StageParseResult } from "./parse";
export { gatherStageRecipeExport, applyStageRecipeJson, recipeToJson } from "./applyRecipe";
