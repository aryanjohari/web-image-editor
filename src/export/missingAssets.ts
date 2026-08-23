import type { AssetRecord } from "../assets/types";
import type { Recipe } from "../recipe/types";

export type MissingAsset = {
  objectId: string;
  role: "main" | "overlay" | "other";
  assetId: string;
};

/** List unresolved `{type:"id"}` refs for visible image objects (M04 missing-asset UX). */
export function listMissingAssets(
  recipe: Recipe,
  assetsById: Map<string, AssetRecord>,
): MissingAsset[] {
  const missing: MissingAsset[] = [];
  for (const obj of recipe.objects) {
    if (!obj.visible || obj.kind !== "image") continue;
    if (obj.source.type !== "id") continue;
    if (assetsById.has(obj.source.assetId)) continue;
    missing.push({
      objectId: obj.id,
      role: obj.role === "main" || obj.role === "overlay" ? obj.role : "other",
      assetId: obj.source.assetId,
    });
  }
  return missing;
}

export function missingMainAssetId(
  recipe: Recipe,
  assetsById: Map<string, AssetRecord>,
): string | null {
  const miss = listMissingAssets(recipe, assetsById).find((m) => m.role === "main");
  return miss?.assetId ?? null;
}
