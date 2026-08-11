import {
  WORKSPACE_DB_NAME,
  WORKSPACE_DB_VERSION,
  WORKSPACE_STORE_ASSETS,
  WORKSPACE_STORE_BRANDS,
} from "./types";

let dbPromise: Promise<IDBDatabase> | null = null;

function upgrade(db: IDBDatabase) {
  if (!db.objectStoreNames.contains(WORKSPACE_STORE_BRANDS)) {
    db.createObjectStore(WORKSPACE_STORE_BRANDS, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(WORKSPACE_STORE_ASSETS)) {
    db.createObjectStore(WORKSPACE_STORE_ASSETS, { keyPath: "id" });
  }
}

/** Open (or reuse) the workspace IndexedDB. */
export function openWorkspaceDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(WORKSPACE_DB_NAME, WORKSPACE_DB_VERSION);
      req.onupgradeneeded = () => {
        upgrade(req.result);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error ?? new Error("Failed to open workspace DB"));
      };
    });
  }
  return dbPromise;
}

/** Test helper — drop cached open promise so next open reuses a fresh factory. */
export function resetWorkspaceDbCache(): void {
  dbPromise = null;
}

export function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB request failed"));
  });
}

export function idbTransactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IDB transaction aborted"));
  });
}
