/**
 * Applies a catalog style preset from the `?preset=<id>` query param.
 *
 * Landing (`/`): hero init runs first via useLandingHero → initLandingHero
 * (loads hero.jpg + LANDING_HOME_PRESET). This hook waits until enabled
 * (isLoading === false), then applies the URL preset on top — style/text only;
 * hero image stays. Never calls initLandingHero.
 *
 * Studio (`/studio`, `/lab` redirects): no hero init; applies catalog style
 * immediately on mount when the param is present. Upload/export afterward still work.
 *
 * Re-applies only when the preset search param changes, not on every render.
 * Query param is left in the address bar for shareable links.
 */
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getPresetById } from "@/data/presetCatalog";
import { applyStylePreset } from "@/lib/preset";
import { getPreserveTextOnApply } from "@/lib/preset/presetApplyPreference";
import {
  isValidCatalogPresetId,
  parsePresetIdFromSearchParams,
} from "@/lib/preset/presetShareUrl";
import { validatePresetV2 } from "@/lib/preset/validate";

export function usePresetFromUrl(options?: {
  /** When false, wait until caller signals ready (e.g. landing hero loaded). */
  enabled?: boolean;
}): { presetId: string | null; applied: boolean; error: string | null } {
  const enabled = options?.enabled ?? true;
  const [searchParams] = useSearchParams();
  const presetId = parsePresetIdFromSearchParams(searchParams);
  const lastAppliedRef = useRef<string | null>(null);

  const error =
    presetId && enabled && !isValidCatalogPresetId(presetId)
      ? `Unknown preset id: ${presetId}`
      : null;

  useEffect(() => {
    if (!enabled || !presetId) {
      return;
    }

    if (!isValidCatalogPresetId(presetId)) {
      if (import.meta.env.DEV) {
        console.warn("[usePresetFromUrl]", `Unknown preset id: ${presetId}`);
      }
      return;
    }

    if (lastAppliedRef.current === presetId) {
      return;
    }

    const entry = getPresetById(presetId);
    if (!entry) {
      return;
    }

    try {
      applyStylePreset(validatePresetV2(entry.preset), { preserveText: getPreserveTextOnApply() });
      lastAppliedRef.current = presetId;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[usePresetFromUrl]", err);
      }
    }
  }, [presetId, enabled]);

  const applied = Boolean(presetId && enabled && isValidCatalogPresetId(presetId));

  return { presetId, applied, error };
}
