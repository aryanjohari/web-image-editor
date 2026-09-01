import { identityText, identityTransform } from "../recipe/identityRecipe";
import type { Effect, Recipe, RegionalGrade, TextObject, Transform2D } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { getPack } from "./catalog";
import { emptyRegional } from "./regionalSliders";
import { typePresetStyle } from "./textPresets";
import type {
  Pack,
  PackRegionalDefaults,
  PackTextHints,
  TextPositionHint,
  TypePresetId,
} from "./types";

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Identity defaults for intensity lerp (M02 §6). */
export function identityParamValue(
  effectId: string,
  key: string,
  packValue: number | string | boolean,
): number | string | boolean {
  if (typeof packValue === "number") {
    if (effectId === "grain" && key === "size") return 0.5;
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
  /** Create a light text object when pack has textHints and none exists. Default true. */
  applyTextHints?: boolean;
};

/** Transform for closed text position hints (M06 §7). */
export function transformForTextPosition(position: TextPositionHint): Transform2D {
  switch (position) {
    case "top-band":
      return { ...identityTransform(), y: 0.38, scaleX: 1, scaleY: 1 };
    case "bottom-left":
      return { ...identityTransform(), x: -0.28, y: -0.38, scaleX: 0.95, scaleY: 0.95 };
    case "center":
      return { ...identityTransform(), x: 0, y: 0 };
    default:
      return identityTransform();
  }
}

export function applyTextHintsToObject(
  textObj: TextObject,
  hints: PackTextHints,
): TextObject {
  const style = typePresetStyle(hints.typePreset);
  return {
    ...textObj,
    transform: transformForTextPosition(hints.position),
    text: {
      ...textObj.text,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontSize: style.fontSize,
      letterSpacing: style.letterSpacing,
      align: style.align,
    },
  };
}

/**
 * Merge pack onto current recipe: rewrite main effects, optional overlay
 * opacity/blend, optional textHints, set packId/packVersion. Never touches AssetRefs.
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
  const applyHints = options.applyTextHints !== false;
  const candidate = deepClone(current);
  const main = candidate.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") {
    throw new Error('applyPack requires a main image object (id role="main")');
  }

  main.effects = scaleEffectsByIntensity(pack.mainEffects, intensity);

  if (main.maskRef && pack.regionalDefaults) {
    main.regional = scaleRegionalDefaults(pack.regionalDefaults, intensity);
  }

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

  if (applyHints && pack.textHints) {
    const textIdx = candidate.objects.findIndex((o) => o.kind === "text");
    if (textIdx >= 0) {
      const t = candidate.objects[textIdx]!;
      if (t.kind === "text") {
        candidate.objects[textIdx] = applyTextHintsToObject(t, pack.textHints);
      }
    } else {
      const created = identityText("Prism");
      candidate.objects.push(applyTextHintsToObject(created, pack.textHints));
    }
  }

  candidate.packId = pack.id;
  candidate.packVersion = pack.version;
  return validateRecipe(candidate);
}

function scaleRegionalDefaults(
  defaults: PackRegionalDefaults,
  intensity: number,
): RegionalGrade {
  const base = emptyRegional();
  if (defaults.subject?.length) {
    base.subject.effects = scaleEffectsByIntensity(defaults.subject, intensity);
  }
  if (defaults.background?.length) {
    base.background.effects = scaleEffectsByIntensity(defaults.background, intensity);
  }
  return base;
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

/** Apply allowlisted text position + type preset (Lab / talk). */
export function applyTextLayout(
  recipe: Recipe,
  opts: { position?: TextPositionHint; typePreset?: TypePresetId; content?: string },
): Recipe {
  const candidate = deepClone(recipe);
  let textIdx = candidate.objects.findIndex((o) => o.kind === "text");
  if (textIdx < 0) {
    candidate.objects.push(identityText(opts.content ?? "Prism"));
    textIdx = candidate.objects.length - 1;
  }
  const t = candidate.objects[textIdx]!;
  if (t.kind !== "text") throw new Error("text object missing");
  let next = t;
  if (opts.position || opts.typePreset) {
    next = applyTextHintsToObject(next, {
      position: opts.position ?? "center",
      typePreset: opts.typePreset ?? "sans-bold",
    });
    // If only one field provided, preserve the other from existing.
    if (!opts.position) {
      next = { ...next, transform: t.transform };
    }
    if (!opts.typePreset) {
      next = {
        ...next,
        text: {
          ...next.text,
          fontFamily: t.text.fontFamily,
          fontWeight: t.text.fontWeight,
          fontSize: t.text.fontSize,
          letterSpacing: t.text.letterSpacing,
          align: t.text.align,
        },
      };
    }
  }
  if (opts.content !== undefined) {
    next = {
      ...next,
      text: { ...next.text, content: opts.content },
    };
  }
  candidate.objects[textIdx] = next;
  return validateRecipe(candidate);
}
