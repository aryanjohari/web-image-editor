/**
 * Phase 2 — apply brief: Gemini patch when enabled, else keyword mood fallback.
 */

import { getPresetById, PRESET_CATALOG } from "@/data/presetCatalog";
import { applyMoodFromTextKeyword } from "@/lib/mood/applyMood";
import { applyPresetPatch, applyStylePreset } from "@/lib/preset";
import { getPreserveTextOnApply } from "@/lib/preset/presetApplyPreference";
import { validatePresetV2 } from "@/lib/preset/validate";
import { gatherStageRecipeExport } from "./applyRecipe";
import { loadActiveBrandKit } from "./brandKitStorage";
import { fetchStageBrief } from "./fetchStageBrief";
import type { StageBrandKit, StageRecipe } from "./types";
import { ensureWorkspaceMigrated, getActiveBrand } from "./workspace";

export type ApplyBriefResult = {
  source: "gemini" | "keyword";
  /** True when AI was attempted but keyword fallback was used */
  aiFailed?: boolean;
  label: string;
  summary?: string;
  baseLookId?: string;
  fallback?: boolean;
};

export type ApplyBriefOptions = {
  preferAi?: boolean;
  brand?: StageBrandKit | null;
  /** When provided, sent as recipe snapshot (conversational). */
  recipe?: StageRecipe | null;
  /** Skip gathering recipe from canvas (tests). */
  canvas?: HTMLCanvasElement | null;
};

function isStageBriefAiEnabled(options?: ApplyBriefOptions): boolean {
  if (options?.preferAi === false) return false;
  if (options?.preferAi === true) return true;
  const stageFlag = import.meta.env.VITE_STAGE_BRIEF_AI_ENABLED;
  if (stageFlag === "true") return true;
  if (stageFlag === "false") return false;
  // Backward-compatible alias
  return import.meta.env.VITE_MOOD_AI_ENABLED === "true";
}

function applyLookThenPatch(baseLookId: string | undefined, patch: Parameters<typeof applyPresetPatch>[0]): string {
  if (baseLookId) {
    const entry = getPresetById(baseLookId);
    if (entry) {
      applyStylePreset(validatePresetV2(entry.preset), {
        preserveText: getPreserveTextOnApply(),
      });
    }
  }
  if (patch && Object.keys(patch).length > 0) {
    applyPresetPatch(patch);
  }
  const entry = baseLookId ? getPresetById(baseLookId) : undefined;
  return entry?.label ?? baseLookId ?? "patch";
}

async function resolveRecipeSnapshot(
  options?: ApplyBriefOptions,
): Promise<StageRecipe | null> {
  if (options?.recipe) return options.recipe;
  if (options?.canvas) {
    try {
      return await gatherStageRecipeExport(options.canvas, false);
    } catch {
      return null;
    }
  }
  return null;
}

/** Active workspace brand, falling back to legacy localStorage kit. */
async function resolveActiveBrand(options?: ApplyBriefOptions): Promise<StageBrandKit | null> {
  if (options?.brand !== undefined) return options.brand;
  try {
    await ensureWorkspaceMigrated();
    const fromWorkspace = await getActiveBrand();
    if (fromWorkspace) return fromWorkspace;
  } catch {
    /* IndexedDB unavailable — legacy path */
  }
  return loadActiveBrandKit();
}

/** Keyword path — same as mood mapMoodToPreset. */
export function applyBriefKeyword(input: string): ApplyBriefResult {
  const result = applyMoodFromTextKeyword(input);
  return {
    source: "keyword",
    label: result.label,
    baseLookId: result.presetId,
    fallback: result.fallback,
  };
}

export async function applyBriefFromText(
  input: string,
  options?: ApplyBriefOptions,
): Promise<ApplyBriefResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Brief is empty");
  }

  if (!isStageBriefAiEnabled(options)) {
    return applyBriefKeyword(trimmed);
  }

  const brand = await resolveActiveBrand(options);
  const recipe = await resolveRecipeSnapshot(options);
  const catalogLookIds =
    brand?.limits?.allowedLookIds?.length
      ? brand.limits.allowedLookIds
      : PRESET_CATALOG.map((e) => e.id);

  try {
    const response = await fetchStageBrief(
      {
        brief: trimmed,
        brand: brand ?? undefined,
        recipe: recipe ?? undefined,
        catalogLookIds,
      },
      brand,
    );

    const label = applyLookThenPatch(response.baseLookId, response.patch);

    return {
      source: "gemini",
      label,
      summary: response.summary,
      baseLookId: response.baseLookId,
    };
  } catch {
    const keywordResult = applyBriefKeyword(trimmed);
    return { ...keywordResult, aiFailed: true };
  }
}

export { isStageBriefAiEnabled };
