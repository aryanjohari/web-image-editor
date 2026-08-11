import type { StageBrandKit } from "../types";
import { idbRequest, idbTransactionDone, openWorkspaceDb } from "./db";
import { notifyWorkspace } from "./notify";
import { WORKSPACE_STORE_BRANDS, normalizeBrandForSave } from "./types";

export async function listBrands(): Promise<StageBrandKit[]> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_BRANDS, "readonly");
  const store = tx.objectStore(WORKSPACE_STORE_BRANDS);
  const rows = await idbRequest(store.getAll() as IDBRequest<StageBrandKit[]>);
  await idbTransactionDone(tx);
  return rows.slice().sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getBrand(id: string): Promise<StageBrandKit | null> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_BRANDS, "readonly");
  const store = tx.objectStore(WORKSPACE_STORE_BRANDS);
  const row = await idbRequest(store.get(id) as IDBRequest<StageBrandKit | undefined>);
  await idbTransactionDone(tx);
  return row ?? null;
}

export async function putBrand(kit: StageBrandKit): Promise<StageBrandKit> {
  const next = normalizeBrandForSave(kit);
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_BRANDS, "readwrite");
  const store = tx.objectStore(WORKSPACE_STORE_BRANDS);
  await idbRequest(store.put(next));
  await idbTransactionDone(tx);
  notifyWorkspace({ type: "brands" });
  return next;
}

export async function deleteBrand(id: string): Promise<void> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_BRANDS, "readwrite");
  const store = tx.objectStore(WORKSPACE_STORE_BRANDS);
  await idbRequest(store.delete(id));
  await idbTransactionDone(tx);
  notifyWorkspace({ type: "brands" });
}
