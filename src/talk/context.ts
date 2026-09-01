/** Build compact recipeContext for talk (no Blobs / AssetRefs). */

import {
  mainHasDuotone,
  mainHasMask,
  readRegionalSliderValue,
  readSliderValue,
  REGIONAL_SLIDERS,
  SEMANTIC_SLIDERS,
  type RegionalSliderId,
  type SemanticSliderId,
} from "../packs";
import type { Recipe } from "../recipe/types";
import type {
  RecipeContext,
  RecipeContextRegionalSliders,
  RecipeContextSelection,
  RecipeContextSliders,
  RecipeContextTransform,
} from "./types";

const TEXT_CONTENT_MAX = 80;

function mainEffectIds(recipe: Recipe): string[] {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") return [];
  return main.effects.map((e) => e.id);
}

function readRegionalSliders(recipe: Recipe): RecipeContextRegionalSliders {
  const out = {} as RecipeContextRegionalSliders;
  for (const spec of REGIONAL_SLIDERS) {
    out[spec.id as RegionalSliderId] = readRegionalSliderValue(recipe, spec.id);
  }
  return out;
}

function compactTransform(t: {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}): RecipeContextTransform {
  return {
    x: t.x,
    y: t.y,
    scaleX: t.scaleX,
    scaleY: t.scaleY,
  };
}

export type BuildRecipeContextOptions = {
  selection?: RecipeContextSelection;
};

export function buildRecipeContext(
  recipe: Recipe,
  options: BuildRecipeContextOptions = {},
): RecipeContext {
  const sliders: RecipeContextSliders = {
    exposure: readSliderValue(recipe, "exposure"),
    contrast: readSliderValue(recipe, "contrast"),
    warmth: readSliderValue(recipe, "warmth"),
    chroma: readSliderValue(recipe, "chroma"),
    fade: readSliderValue(recipe, "fade"),
    grain: readSliderValue(recipe, "grain"),
    grain_size: readSliderValue(recipe, "grain_size"),
    vignette: readSliderValue(recipe, "vignette"),
    blur: readSliderValue(recipe, "blur"),
  };
  if (mainHasDuotone(recipe)) {
    sliders.duotone = readSliderValue(recipe, "duotone");
  }
  const hasMask = mainHasMask(recipe);
  const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
  const text = recipe.objects.find((o) => o.kind === "text");
  const hasOverlay = !!(overlay && overlay.kind === "image");
  const hasText = !!(text && text.kind === "text");

  return {
    packId: recipe.packId,
    packVersion: recipe.packVersion,
    sliders,
    mainEffectIds: mainEffectIds(recipe),
    ...(hasMask
      ? { hasMask: true, regionalSliders: readRegionalSliders(recipe) }
      : {}),
    hasOverlay,
    hasText,
    ...(hasText && text && text.kind === "text"
      ? {
          textContent: text.text.content.slice(0, TEXT_CONTENT_MAX),
          textTransform: compactTransform(text.transform),
        }
      : {}),
    ...(hasOverlay && overlay && overlay.kind === "image"
      ? { overlayTransform: compactTransform(overlay.transform) }
      : {}),
    selection: options.selection ?? "none",
  };
}

/** Slider ids present in context (for tests / debugging). */
export function contextSliderIds(): SemanticSliderId[] {
  return SEMANTIC_SLIDERS.map((s) => s.id);
}
