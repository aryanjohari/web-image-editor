/**
 * Build / apply StageRecipe for lab export & import (reuses preset gather + hydrate).
 */

import {
  applySynthPreset,
  buildPreset,
  gatherPresetExportInput,
  type SynthPresetV2,
} from "@/lib/preset";
import {
  mergeStageAssetsIntoRecipe,
  stageRecipeToSynthPresetV2,
  synthPresetV2ToStageRecipe,
  STAGE_BG_ASSET_ID,
  STAGE_DECAL_ASSET_ID,
  type StageRecipeWithV2Compat,
} from "./adaptPreset";
import {
  collectLabDraftExtrasForRecipe,
  getLabStageAssetBySlot,
  replaceLabStageDraftFromRecipeAssets,
} from "./labStageDraft";
import { parseStageRecipe } from "./parse";
import type { StageRecipe } from "./types";

export function recipeToJson(recipe: StageRecipe, pretty = true): string {
  return JSON.stringify(recipe, null, pretty ? 2 : undefined);
}

/** Snapshot current lab scene as StageRecipe (v2 store + optional draft extras). */
export async function gatherStageRecipeExport(
  canvas: HTMLCanvasElement,
  includeAssets: boolean,
): Promise<StageRecipeWithV2Compat> {
  const input = await gatherPresetExportInput(canvas, includeAssets);
  const preset = buildPreset(input);
  let recipe = synthPresetV2ToStageRecipe(preset);

  if (includeAssets) {
    const draftBg = getLabStageAssetBySlot("background");
    const draftDecal = getLabStageAssetBySlot("decal");
    const extras = collectLabDraftExtrasForRecipe(
      draftBg?.id ?? STAGE_BG_ASSET_ID,
      draftDecal?.id ?? STAGE_DECAL_ASSET_ID,
    );
    // Prefer adaptor-encoded GPU assets for primary slots; fold in draft extras.
    const mergedAssets = { ...extras.assets, ...recipe.assets };
    recipe = mergeStageAssetsIntoRecipe({ ...recipe, assets: mergedAssets }, {}, extras.extraLayers);
  }

  return recipe;
}

export type ApplyStageRecipeResult =
  | { ok: true; recipe: StageRecipe; preset: SynthPresetV2 }
  | { ok: false; error: string };

/** Validate + convert + hydrate compositor; sync lab draft asset list. */
export async function applyStageRecipeJson(text: string): Promise<ApplyStageRecipeResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  const parsed = parseStageRecipe(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const recipe = parsed.data;
  const imageLayers = recipe.layers.filter((l) => l.type === "image");
  const decalLayers = recipe.layers.filter((l) => l.type === "decal");
  const primaryBgId = imageLayers.sort((a, b) => a.zIndex - b.zIndex)[0]?.assetId;
  const primaryDecalId = decalLayers.sort((a, b) => a.zIndex - b.zIndex)[0]?.assetId;

  const preset = stageRecipeToSynthPresetV2(recipe, {
    primaryImageAssetId: primaryBgId,
    primaryDecalAssetId: primaryDecalId,
  });

  await applySynthPreset(preset);
  replaceLabStageDraftFromRecipeAssets(recipe.assets, primaryBgId, primaryDecalId);

  return { ok: true, recipe, preset };
}
