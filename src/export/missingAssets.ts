import type { AssetRecord } from "../assets/types";
import type { Recipe } from "../recipe/types";

export type MissingAsset = {
  objectId: string;
  role: "main" | "overlay" | "mask" | "other";
  assetId: string;
};

/** List unresolved `{type:"id"}` refs for visible image objects and main masks (M04/M05). */
export function listMissingAssets(
  recipe: Recipe,
  assetsById: Map<string, AssetRecord>,
): MissingAsset[] {
  const missing: MissingAsset[] = [];
  for (const obj of recipe.objects) {
    if (!obj.visible || obj.kind !== "image") continue;
    if (obj.source.type === "id" && !assetsById.has(obj.source.assetId)) {
      missing.push({
        objectId: obj.id,
        role: obj.role === "main" || obj.role === "overlay" ? obj.role : "other",
        assetId: obj.source.assetId,
      });
    }
    if (
      obj.role === "main" &&
      obj.maskRef?.type === "id" &&
      !assetsById.has(obj.maskRef.assetId)
    ) {
      missing.push({
        objectId: obj.id,
        role: "mask",
        assetId: obj.maskRef.assetId,
      });
    }
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

export function missingMaskAssetId(
  recipe: Recipe,
  assetsById: Map<string, AssetRecord>,
): string | null {
  const miss = listMissingAssets(recipe, assetsById).find((m) => m.role === "mask");
  return miss?.assetId ?? null;
}
