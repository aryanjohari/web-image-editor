import { getPresetById } from "@/data/presetCatalog";
import { applyPresetPatch, applyStylePreset, type PresetPatch } from "@/lib/preset";
import { getPreserveTextOnApply } from "@/lib/preset/presetApplyPreference";
import { validatePresetV2 } from "@/lib/preset/validate";
import { useSynthStore } from "@/store/useSynthStore";
import { fetchAiMood } from "./fetchAiMood";
import { mapMoodToPreset, MOOD_FALLBACK_PRESET_ID } from "./mapMoodToPreset";
import { parseAiMoodResponse } from "./parseAiMoodResponse";
import type { AiMoodResponse } from "./types";

export type ApplyMoodResult = {
  presetId: string;
  label: string;
  fallback: boolean;
  source: "ai" | "keyword";
  /** True when AI was attempted but keyword fallback was used */
  aiFailed?: boolean;
};

export type ApplyMoodOptions = {
  /** Default true when VITE_MOOD_AI_ENABLED is "true" */
  preferAi?: boolean;
};

function isAiMoodEnabled(options?: ApplyMoodOptions): boolean {
  if (options?.preferAi === false) return false;
  if (options?.preferAi === true) return true;
  const stageFlag = import.meta.env.VITE_STAGE_BRIEF_AI_ENABLED;
  if (stageFlag === "true") return true;
  if (stageFlag === "false") return false;
  return import.meta.env.VITE_MOOD_AI_ENABLED === "true";
}

function applyMoodMapping(presetId: string, patch?: PresetPatch): { presetId: string; label: string } {
  const entry = getPresetById(presetId) ?? getPresetById(MOOD_FALLBACK_PRESET_ID);

  if (!entry) {
    throw new Error(`Mood fallback preset "${MOOD_FALLBACK_PRESET_ID}" is missing from catalog`);
  }

  useSynthStore.getState().setDecalTexture(null);
  applyStylePreset(validatePresetV2(entry.preset), { preserveText: getPreserveTextOnApply() });

  if (patch) {
    applyPresetPatch(patch);
  }

  return { presetId: entry.id, label: entry.label };
}

function applyAiMoodResponse(response: AiMoodResponse): ApplyMoodResult {
  const { presetId, label } = applyMoodMapping(response.basePresetId, response.patch);
  return {
    presetId,
    label,
    fallback: false,
    source: "ai",
  };
}

/** Sync keyword-only mood apply — Phase 5 behavior. */
export function applyMoodFromTextKeyword(input: string): ApplyMoodResult {
  const mapped = mapMoodToPreset(input);
  const { presetId, label } = applyMoodMapping(mapped.presetId, mapped.patch);

  return {
    presetId,
    label,
    fallback: mapped.fallback ?? false,
    source: "keyword",
  };
}

export async function applyMoodFromText(
  input: string,
  options?: ApplyMoodOptions,
): Promise<ApplyMoodResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Mood input is empty");
  }

  if (!isAiMoodEnabled(options)) {
    return applyMoodFromTextKeyword(trimmed);
  }

  try {
    const raw = await fetchAiMood(trimmed);
    const parsed = parseAiMoodResponse(JSON.stringify(raw));
    if (!parsed.ok) {
      throw new Error(parsed.error);
    }
    return applyAiMoodResponse(parsed.data);
  } catch {
    const keywordResult = applyMoodFromTextKeyword(trimmed);
    return { ...keywordResult, aiFailed: true };
  }
}
