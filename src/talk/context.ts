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
import type { RecipeContext, RecipeContextRegionalSliders, RecipeContextSliders } from "./types";

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
  const hasMask = mainHasMask(recipe);
  return {
    packId: recipe.packId,
    packVersion: recipe.packVersion,
    sliders,
    mainEffectIds: mainEffectIds(recipe),
    ...(hasMask
      ? { hasMask: true, regionalSliders: readRegionalSliders(recipe) }
      : {}),
  };
}

/** Slider ids present in context (for tests / debugging). */
export function contextSliderIds(): SemanticSliderId[] {
  return SEMANTIC_SLIDERS.map((s) => s.id);
}
