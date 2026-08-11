/**
 * One-shot: import legacy localStorage brand kit into IndexedDB when brands store is empty.
 */

import { loadActiveBrandKit } from "../brandKitStorage";
import type { StageBrandKit } from "../types";
import { setActiveBrandId } from "./activeBrand";
import { listBrands, putBrand } from "./brands";
import { openWorkspaceDb } from "./db";
import { notifyWorkspace } from "./notify";

let migratePromise: Promise<boolean> | null = null;

/** Pure: import legacy kit only when workspace has zero brands. */
export function pickLegacyBrandForMigration(
  existingBrands: readonly StageBrandKit[],
  legacy: StageBrandKit | null,
): StageBrandKit | null {
  if (existingBrands.length > 0) return null;
  return legacy;
}

/**
 * Ensures workspace DB exists and migrates the old single-kit localStorage brand once.
 * Returns true when a legacy kit was imported.
 */
export async function ensureWorkspaceMigrated(): Promise<boolean> {
  if (!migratePromise) {
    migratePromise = runMigration();
  }
  return migratePromise;
}

async function runMigration(): Promise<boolean> {
  await openWorkspaceDb();
  const existing = await listBrands();
  const legacy = pickLegacyBrandForMigration(existing, loadActiveBrandKit());
  if (!legacy) return false;

  await putBrand(legacy);
  setActiveBrandId(legacy.id);
  notifyWorkspace({ type: "migrated" });
  return true;
}

/** Test helper */
export function resetWorkspaceMigrationCache(): void {
  migratePromise = null;
}
