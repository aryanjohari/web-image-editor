import { AssetStoreError } from "./errors";
import type { AssetMeta, AssetRecord } from "./types";

const DB_NAME = "prism-assets";
const DB_VERSION = 1;
const STORE = "assets";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () =>
      reject(new AssetStoreError("OPEN", req.error?.message ?? "failed to open IndexedDB"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "assetId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new AssetStoreError("TX", req.error?.message ?? "IndexedDB request failed"));
  });
}

export async function putAsset(
  assetId: string,
  blob: Blob,
  meta?: Partial<Pick<AssetMeta, "width" | "height" | "name">>,
): Promise<AssetRecord> {
  if (!assetId) {
    throw new AssetStoreError("EMPTY_ID", "assetId must be non-empty");
  }
  if (!(blob instanceof Blob)) {
    throw new AssetStoreError("TYPE", "blob must be a Blob", assetId);
  }
  const record: AssetRecord = {
    assetId,
    blob,
    mime: blob.type || "application/octet-stream",
    createdAt: new Date().toISOString(),
    width: meta?.width,
    height: meta?.height,
    name: meta?.name,
  };
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await reqToPromise(store.put(record));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(new AssetStoreError("TX", tx.error?.message ?? "put transaction failed", assetId));
    });
    return record;
  } finally {
    db.close();
  }
}

export async function getAsset(assetId: string): Promise<AssetRecord> {
  if (!assetId) {
    throw new AssetStoreError("EMPTY_ID", "assetId must be non-empty");
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const result = await reqToPromise(store.get(assetId));
    if (!result) {
      throw new AssetStoreError(
        "MISSING",
        `asset "${assetId}" missing — re-upload`,
        assetId,
      );
    }
    return result as AssetRecord;
  } finally {
    db.close();
  }
}

export async function listAssets(): Promise<AssetMeta[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const all = (await reqToPromise(store.getAll())) as AssetRecord[];
    return all.map((rec) => {
      const { blob: _omit, ...meta } = rec;
      void _omit;
      return meta;
    });
  } finally {
    db.close();
  }
}

export async function deleteAsset(assetId: string): Promise<void> {
  if (!assetId) {
    throw new AssetStoreError("EMPTY_ID", "assetId must be non-empty");
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await reqToPromise(store.delete(assetId));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(
          new AssetStoreError("TX", tx.error?.message ?? "delete transaction failed", assetId),
        );
    });
  } finally {
    db.close();
  }
}

/** Resolve AssetRef id from store; throws MISSING loudly. */
export async function resolveAssetId(assetId: string): Promise<AssetRecord> {
  return getAsset(assetId);
}
