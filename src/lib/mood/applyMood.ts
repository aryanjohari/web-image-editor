import { getPresetById } from "@/data/presetCatalog";
import { applyPresetPatch, applyStylePreset } from "@/lib/preset";
import { validatePresetV2 } from "@/lib/preset/validate";
import { useSynthStore } from "@/store/useSynthStore";
import { mapMoodToPreset, MOOD_FALLBACK_PRESET_ID } from "./mapMoodToPreset";

export type ApplyMoodResult = {
  presetId: string;
  label: string;
  fallback: boolean;
};

export function applyMoodFromText(input: string): ApplyMoodResult {
  const mapped = mapMoodToPreset(input);
  const entry =
    getPresetById(mapped.presetId) ?? getPresetById(MOOD_FALLBACK_PRESET_ID);

  if (!entry) {
    throw new Error(`Mood fallback preset "${MOOD_FALLBACK_PRESET_ID}" is missing from catalog`);
  }

  useSynthStore.getState().setDecalTexture(null);
  applyStylePreset(validatePresetV2(entry.preset));

  if (mapped.patch) {
    applyPresetPatch(mapped.patch);
  }

  return {
    presetId: entry.id,
    label: entry.label,
    fallback: mapped.fallback ?? false,
  };
}
