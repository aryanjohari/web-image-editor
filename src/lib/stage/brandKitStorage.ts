/**
 * Legacy single-kit localStorage — kept for one-shot migrate into IndexedDB workspace.
 * New lab UI uses `src/lib/stage/workspace/` (multi-brand + assets).
 */

import { parseBrandKit } from "./parse";
import type { StageBrandKit } from "./types";

export const STAGE_BRAND_KIT_STORAGE_KEY = "stage.activeBrandKit.v1";

/** Default empty kit when nothing is saved — brief AI still works with a weaker prompt. */
export function createDefaultActiveBrandKit(): StageBrandKit {
  return {
    id: "local-default",
    name: "",
    colors: [],
    fonts: [],
  };
}

export function loadActiveBrandKit(): StageBrandKit | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAGE_BRAND_KIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const result = parseBrandKit(parsed);
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}

export function saveActiveBrandKit(kit: StageBrandKit): StageBrandKit {
  const now = new Date().toISOString();
  const next: StageBrandKit = {
    ...kit,
    id: kit.id.trim() || "local-default",
    name: kit.name.trim() || "Untitled brand",
    updatedAt: now,
    createdAt: kit.createdAt ?? now,
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STAGE_BRAND_KIT_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearActiveBrandKit(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STAGE_BRAND_KIT_STORAGE_KEY);
}

/** True when the kit has enough content to strengthen the LLM constitution. */
export function brandKitHasRules(kit: StageBrandKit | null | undefined): boolean {
  if (!kit) return false;
  if (kit.colors.length > 0) return true;
  if (kit.fonts.length > 0) return true;
  if (kit.voiceNotes?.trim()) return true;
  if (kit.limits?.allowedLookIds?.length) return true;
  if (kit.limits?.maxMeltIntensity !== undefined) return true;
  if (kit.limits?.maxNoiseLevel !== undefined) return true;
  if (kit.limits?.maxScanlineIntensity !== undefined) return true;
  return Boolean(kit.name.trim() && kit.name !== "Untitled brand");
}
