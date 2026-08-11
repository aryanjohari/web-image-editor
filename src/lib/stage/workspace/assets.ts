import { idbRequest, idbTransactionDone, openWorkspaceDb } from "./db";
import { notifyWorkspace } from "./notify";
import {
  WORKSPACE_STORE_ASSETS,
  createAssetId,
  type WorkspaceAsset,
} from "./types";

const SUPPORTED_ASSET_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Infer image mime from a filename extension when the File type is empty. */
export function mimeFromFileName(name: string): string | null {
  const lower = name.trim().toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

/** Normalize mime; empty / octet-stream falls back to extension when possible. */
export function normalizeAssetMime(mime: string | undefined, fileName: string): string {
  const trimmed = (mime ?? "").trim().toLowerCase();
  if (trimmed === "image/jpg") return "image/jpeg";
  if (trimmed && trimmed !== "application/octet-stream") return trimmed;
  return mimeFromFileName(fileName) ?? (trimmed || "application/octet-stream");
}

export function assertSupportedAssetMime(mime: string): void {
  const m = mime.toLowerCase();
  if (!SUPPORTED_ASSET_MIMES.has(m)) {
    throw new Error(
      `Unsupported image type${mime ? `: ${mime}` : ""}. Use JPG, PNG, or WebP.`,
    );
  }
}

/**
 * Coerce IDB row payload into a usable Blob (defensive for ArrayBuffer / empty type).
 * Returns null when bytes are missing or unusable.
 */
export function coerceAssetBlob(value: unknown, mime: string): Blob | null {
  const type = mime || "image/jpeg";
  if (value instanceof Blob) {
    if (value.size <= 0) return null;
    if (!value.type && type) return new Blob([value], { type });
    return value;
  }
  if (value instanceof ArrayBuffer) {
    if (value.byteLength <= 0) return null;
    return new Blob([value], { type });
  }
  if (ArrayBuffer.isView(value)) {
    if (value.byteLength <= 0) return null;
    const bytes = new Uint8Array(value.byteLength);
    bytes.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    return new Blob([bytes], { type });
  }
  return null;
}

/** Ensure get/list rows always expose a Blob when bytes are present. */
export function normalizeAssetRow(row: WorkspaceAsset): WorkspaceAsset {
  const mime = normalizeAssetMime(row.mime, row.name);
  const blob = coerceAssetBlob(row.blob, mime);
  if (!blob) {
    return {
      ...row,
      mime,
      blob: row.blob instanceof Blob ? row.blob : new Blob([], { type: mime }),
    };
  }
  return { ...row, mime, blob };
}

export type PutAssetFromFileInput = {
  file: File;
  kind?: WorkspaceAsset["kind"];
  id?: string;
  width?: number;
  height?: number;
};

/**
 * Pure builder: copy file bytes into a Blob (do not store a live File handle for IDB).
 * Throws on unsupported / empty files so the UI can surface the message.
 */
export async function buildWorkspaceAssetFromFile(
  input: PutAssetFromFileInput,
): Promise<WorkspaceAsset> {
  const { file, kind = "image", id, width, height } = input;
  const mime = normalizeAssetMime(file.type, file.name);
  assertSupportedAssetMime(mime);

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error("Empty file — nothing to store.");
  }

  const blob = new Blob([buffer], { type: mime });
  return {
    id: id ?? createAssetId(),
    name: file.name || "Untitled asset",
    mime,
    kind,
    blob,
    createdAt: new Date().toISOString(),
    width,
    height,
  };
}

export async function listAssets(): Promise<WorkspaceAsset[]> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_ASSETS, "readonly");
  const store = tx.objectStore(WORKSPACE_STORE_ASSETS);
  const rows = await idbRequest(store.getAll() as IDBRequest<WorkspaceAsset[]>);
  await idbTransactionDone(tx);
  return rows
    .map(normalizeAssetRow)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAsset(id: string): Promise<WorkspaceAsset | null> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_ASSETS, "readonly");
  const store = tx.objectStore(WORKSPACE_STORE_ASSETS);
  const row = await idbRequest(store.get(id) as IDBRequest<WorkspaceAsset | undefined>);
  await idbTransactionDone(tx);
  return row ? normalizeAssetRow(row) : null;
}

export async function putAsset(asset: WorkspaceAsset): Promise<WorkspaceAsset> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_ASSETS, "readwrite");
  const store = tx.objectStore(WORKSPACE_STORE_ASSETS);
  await idbRequest(store.put(asset));
  await idbTransactionDone(tx);
  notifyWorkspace({ type: "assets" });
  return asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openWorkspaceDb();
  const tx = db.transaction(WORKSPACE_STORE_ASSETS, "readwrite");
  const store = tx.objectStore(WORKSPACE_STORE_ASSETS);
  await idbRequest(store.delete(id));
  await idbTransactionDone(tx);
  notifyWorkspace({ type: "assets" });
}

export async function putAssetFromFile(input: PutAssetFromFileInput): Promise<WorkspaceAsset> {
  const asset = await buildWorkspaceAssetFromFile(input);
  return putAsset(asset);
}
