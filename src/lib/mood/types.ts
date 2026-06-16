import type { PresetPatch } from "@/lib/preset/apply";

/** Runtime AI mood response — not a preset file; no schema version. */
export type AiMoodResponse = {
  basePresetId: string;
  patch?: PresetPatch;
};
