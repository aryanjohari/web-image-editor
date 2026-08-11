export {
  WORKSPACE_DB_NAME,
  WORKSPACE_DB_VERSION,
  WORKSPACE_STORE_BRANDS,
  WORKSPACE_STORE_ASSETS,
  WORKSPACE_ACTIVE_BRAND_ID_KEY,
  isOverlayMime,
  isHeroMime,
  createBrandId,
  createAssetId,
  normalizeBrandForSave,
} from "./types";
export type { WorkspaceAsset, WorkspaceBrand } from "./types";

export { openWorkspaceDb, resetWorkspaceDbCache } from "./db";
export { listBrands, getBrand, putBrand, deleteBrand } from "./brands";
export {
  listAssets,
  getAsset,
  putAsset,
  deleteAsset,
  putAssetFromFile,
  buildWorkspaceAssetFromFile,
  normalizeAssetMime,
  mimeFromFileName,
  coerceAssetBlob,
  normalizeAssetRow,
  assertSupportedAssetMime,
} from "./assets";
export type { PutAssetFromFileInput } from "./assets";
export { getActiveBrandId, setActiveBrandId, getActiveBrand } from "./activeBrand";
export {
  ensureWorkspaceMigrated,
  pickLegacyBrandForMigration,
  resetWorkspaceMigrationCache,
} from "./migrate";
export { subscribeWorkspace, notifyWorkspace } from "./notify";
export type { WorkspaceChange } from "./notify";
