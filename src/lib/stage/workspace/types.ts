/**
 * Lab local workspace — IndexedDB brands + asset blobs (no auth / sync).
 */

import type { StageAssetKind, StageBrandKit } from "../types";

export const WORKSPACE_DB_NAME = "stage-workspace";
export const WORKSPACE_DB_VERSION = 1;

export const WORKSPACE_STORE_BRANDS = "brands";
export const WORKSPACE_STORE_ASSETS = "assets";

/** localStorage key pointing at the active brand id in IndexedDB. */
export const WORKSPACE_ACTIVE_BRAND_ID_KEY = "stage.workspace.activeBrandId.v1";

export type WorkspaceAsset = {
  id: string;
  name: string;
  mime: string;
  kind: StageAssetKind;
  /** Source bytes — Blob for object URLs + TextureLoader */
  blob: Blob;
  createdAt: string;
  width?: number;
  height?: number;
};

export type WorkspaceBrand = StageBrandKit;

export function isOverlayMime(mime: string): boolean {
  const m = mime.toLowerCase();
  return m === "image/png" || m === "image/webp";
}

export function isHeroMime(mime: string): boolean {
  const m = mime.toLowerCase();
  return m === "image/png" || m === "image/jpeg" || m === "image/jpg" || m === "image/webp";
}

export function createBrandId(): string {
  return `brand-${crypto.randomUUID()}`;
}

export function createAssetId(): string {
  return `asset-${crypto.randomUUID()}`;
}

export function normalizeBrandForSave(kit: StageBrandKit): StageBrandKit {
  const now = new Date().toISOString();
  return {
    ...kit,
    id: kit.id.trim() || createBrandId(),
    name: kit.name.trim() || "Untitled brand",
    colors: kit.colors ?? [],
    fonts: kit.fonts ?? [],
    updatedAt: now,
    createdAt: kit.createdAt ?? now,
  };
}
