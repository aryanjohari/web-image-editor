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
export {
  STAGE_BRAND_KIT_STORAGE_KEY,
  createDefaultActiveBrandKit,
  loadActiveBrandKit,
  saveActiveBrandKit,
  clearActiveBrandKit,
  brandKitHasRules,
} from "./brandKitStorage";
export { buildBriefSystemPrompt } from "./buildBriefSystemPrompt";
export type { BuildBriefSystemPromptInput, BriefPromptCatalogEntry } from "./buildBriefSystemPrompt";
export {
  parseStageBriefResponse,
  clampPatchToBrandLimits,
  stripMarkdownFences,
} from "./validateBriefPatch";
export type { StageBriefPatchResult, ParseStageBriefResult } from "./validateBriefPatch";
export { applyBriefFromText, applyBriefKeyword, isStageBriefAiEnabled } from "./applyBrief";
export type { ApplyBriefResult, ApplyBriefOptions } from "./applyBrief";
export { fetchStageBrief, StageBriefFetchError } from "./fetchStageBrief";
export {
  runStageBrief,
  getGeminiApiKeyFromEnv,
  getGeminiModelFromEnv,
} from "./runStageBrief";
export {
  buildCampaignPackArtifacts,
  downloadCampaignPack,
  downloadBlob,
  resolveDefaultStillPackProfiles,
  stillPackFilename,
  PackCaptureError,
  STAGE_RECIPE_PACK_FILENAME,
  WEB_HERO_LIVE_NOTE_FILENAME,
  CAMPAIGN_PACK_ZIP_FILENAME,
  WEB_HERO_LIVE_NOTE,
} from "./exportCampaignPack";
export type {
  BuildCampaignPackOptions,
  CampaignPackArtifact,
  CampaignPackBuildResult,
  CampaignPackStillArtifact,
} from "./exportCampaignPack";
export {
  getPackExportViewportTarget,
  setPackExportViewport,
  subscribePackExportViewport,
  notifyPackExportViewportReady,
} from "./packExportViewport";
export type { PackExportViewportSize } from "./packExportViewport";
export {
  getEmbedLayerStyle,
  prefersReducedMotion,
  shouldFreezeEmbedMotion,
  STAGE_EMBED_DEFAULT_Z_INDEX,
  STAGE_EMBED_SNIPPET,
} from "./embed";
export type { EmbedLayerStyle, MatchMediaFn, StageEmbedBackgroundProps } from "./embed";
// StageEmbedBackground is React — import from "@/lib/stage/embed" in components to avoid
// pulling the canvas into non-UI bundles unintentionally. Re-exported for convenience:
export { StageEmbedBackground } from "./embed";
export {
  WORKSPACE_DB_NAME,
  WORKSPACE_ACTIVE_BRAND_ID_KEY,
  ensureWorkspaceMigrated,
  getActiveBrand,
  getActiveBrandId,
  setActiveBrandId,
  listBrands,
  putBrand,
  deleteBrand,
  listAssets,
  putAssetFromFile,
  deleteAsset,
  subscribeWorkspace,
  isOverlayMime,
  isHeroMime,
  createBrandId,
} from "./workspace";
export type { WorkspaceAsset, WorkspaceChange } from "./workspace";
