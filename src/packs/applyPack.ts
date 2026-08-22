import type { Effect, Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { getPack } from "./catalog";
import type { Pack } from "./types";

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Identity defaults for intensity lerp (M02 §6). */
export function identityParamValue(
  _effectId: string,
  _key: string,
  packValue: number | string | boolean,
): number | string | boolean {
  if (typeof packValue === "number") {
    return 0;
  }
  // Non-numeric params (duotone colors) stay at pack value — not lerped.
  return packValue;
}

/** Scale pack mainEffects toward identity by intensity ∈ [0,1]. */
export function scaleEffectsByIntensity(
  effects: Effect[],
  intensity: number,
): Effect[] {
  const t = Math.min(1, Math.max(0, intensity));
  return effects.map((ef) => {
    const params: Effect["params"] = {};
    for (const [key, val] of Object.entries(ef.params)) {
      if (typeof val === "number") {
        const id = identityParamValue(ef.id, key, val) as number;
        params[key] = id + (val - id) * t;
      } else {
        params[key] = val;
      }
    }
    return { id: ef.id, params };
  });
}

export type ApplyPackOptions = {
  /** Lab intensity ∈ [0,1]; default 1. Absolute params written to recipe. */
  intensity?: number;
};

/**
 * Merge pack onto current recipe: rewrite main effects, optional overlay
 * opacity/blend, set packId/packVersion. Never touches AssetRefs or text.
 */
export function applyPack(
  current: Recipe,
  packId: string,
  options: ApplyPackOptions = {},
): Recipe {
  const pack = getPack(packId);
  return applyPackData(current, pack, options);
}

export function applyPackData(
  current: Recipe,
  pack: Pack,
  options: ApplyPackOptions = {},
): Recipe {
  const intensity = options.intensity ?? 1;
  const candidate = deepClone(current);
  const main = candidate.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") {
    throw new Error('applyPack requires a main image object (id role="main")');
  }

  main.effects = scaleEffectsByIntensity(pack.mainEffects, intensity);

  if (pack.overlay) {
    const overlay = candidate.objects.find(
      (o) => o.kind === "image" && o.role === "overlay",
    );
    if (overlay && overlay.kind === "image") {
      if (pack.overlay.opacity !== undefined) {
        overlay.opacity = pack.overlay.opacity;
      }
      if (pack.overlay.blend !== undefined) {
        overlay.blend = pack.overlay.blend;
      }
    }
  }

  candidate.packId = pack.id;
  candidate.packVersion = pack.version;
  return validateRecipe(candidate);
}

/** Clear main effects + pack provenance; keep assets/text. */
export function resetLook(current: Recipe): Recipe {
  const candidate = deepClone(current);
  const main = candidate.objects.find((o) => o.kind === "image" && o.role === "main");
  if (main && main.kind === "image") {
    main.effects = [];
  }
  candidate.packId = null;
  candidate.packVersion = null;
  return validateRecipe(candidate);
}
