import type { Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { triggerDownload } from "./download";

function recipeFilename(recipe: Recipe): string {
  const title = recipe.meta?.title?.trim();
  if (title) {
    const safe = title.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    if (safe) return `${safe}.json`;
  }
  return "prism-recipe.json";
}

/** Download validated recipe JSON (no image bytes). */
export function downloadRecipeJson(recipe: Recipe, filename?: string): void {
  const validated = validateRecipe(recipe);
  const json = JSON.stringify(validated, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  triggerDownload(blob, filename ?? recipeFilename(validated));
}
