/** Build compact recipeContext for talk (no Blobs / AssetRefs). */

import {
  mainHasDuotone,
  readSliderValue,
  SEMANTIC_SLIDERS,
  type SemanticSliderId,
} from "../packs/sliders";
import type { Recipe } from "../recipe/types";
import type { RecipeContext, RecipeContextSliders } from "./types";

function mainEffectIds(recipe: Recipe): string[] {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  if (!main || main.kind !== "image") return [];
  return main.effects.map((e) => e.id);
}

export function buildRecipeContext(recipe: Recipe): RecipeContext {
  const sliders: RecipeContextSliders = {
    exposure: readSliderValue(recipe, "exposure"),
    contrast: readSliderValue(recipe, "contrast"),
    warmth: readSliderValue(recipe, "warmth"),
    chroma: readSliderValue(recipe, "chroma"),
    fade: readSliderValue(recipe, "fade"),
    grain: readSliderValue(recipe, "grain"),
    vignette: readSliderValue(recipe, "vignette"),
  };
  if (mainHasDuotone(recipe)) {
    sliders.duotone = readSliderValue(recipe, "duotone");
  }
  return {
    packId: recipe.packId,
    packVersion: recipe.packVersion,
    sliders,
    mainEffectIds: mainEffectIds(recipe),
  };
}

/** Slider ids present in context (for tests / debugging). */
export function contextSliderIds(): SemanticSliderId[] {
  return SEMANTIC_SLIDERS.map((s) => s.id);
}
