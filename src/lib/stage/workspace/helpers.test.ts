import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertSupportedAssetMime,
  buildWorkspaceAssetFromFile,
  coerceAssetBlob,
  mimeFromFileName,
  normalizeAssetMime,
  normalizeAssetRow,
} from "./assets";
import { pickLegacyBrandForMigration } from "./migrate";
import {
  createAssetId,
  createBrandId,
  isHeroMime,
  isOverlayMime,
  normalizeBrandForSave,
  type WorkspaceAsset,
} from "./types";
import type { StageBrandKit } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("workspace helpers", () => {
  it("classifies hero / overlay mimes", () => {
    expect(isHeroMime("image/jpeg")).toBe(true);
    expect(isHeroMime("image/png")).toBe(true);
    expect(isHeroMime("image/webp")).toBe(true);
    expect(isHeroMime("image/gif")).toBe(false);
    expect(isOverlayMime("image/png")).toBe(true);
    expect(isOverlayMime("image/webp")).toBe(true);
    expect(isOverlayMime("image/jpeg")).toBe(false);
  });

  it("normalizeBrandForSave fills name/id/timestamps", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "fixed-uuid" });
    const saved = normalizeBrandForSave({
      id: "  ",
      name: "  ",
      colors: [{ id: "c1", hex: "#000" }],
      fonts: [],
    });
    expect(saved.id).toBe("brand-fixed-uuid");
    expect(saved.name).toBe("Untitled brand");
    expect(saved.createdAt).toBeTruthy();
    expect(saved.updatedAt).toBeTruthy();
    expect(saved.colors[0]?.hex).toBe("#000");
  });

  it("keeps provided brand id and name", () => {
    const saved = normalizeBrandForSave({
      id: "b1",
      name: "Acme",
      colors: [],
      fonts: [],
      createdAt: "2020-01-01T00:00:00.000Z",
    });
    expect(saved.id).toBe("b1");
    expect(saved.name).toBe("Acme");
    expect(saved.createdAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("creates brand/asset ids", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "abc" });
    expect(createBrandId()).toBe("brand-abc");
    expect(createAssetId()).toBe("asset-abc");
  });

  it("pickLegacyBrandForMigration imports only when empty", () => {
    const legacy: StageBrandKit = { id: "legacy", name: "Old", colors: [], fonts: [] };
    expect(pickLegacyBrandForMigration([], legacy)?.id).toBe("legacy");
    expect(pickLegacyBrandForMigration([], null)).toBeNull();
    expect(
      pickLegacyBrandForMigration([{ id: "b1", name: "A", colors: [], fonts: [] }], legacy),
    ).toBeNull();
  });
});

describe("workspace asset blob helpers", () => {
  it("infers mime from filename when type is empty", () => {
    expect(mimeFromFileName("shot.JPG")).toBe("image/jpeg");
    expect(mimeFromFileName("a.jpeg")).toBe("image/jpeg");
    expect(mimeFromFileName("logo.png")).toBe("image/png");
    expect(mimeFromFileName("bg.webp")).toBe("image/webp");
    expect(mimeFromFileName("raw.heic")).toBeNull();
    expect(normalizeAssetMime("", "photo.jpg")).toBe("image/jpeg");
    expect(normalizeAssetMime("image/jpg", "x")).toBe("image/jpeg");
    expect(normalizeAssetMime("application/octet-stream", "x.png")).toBe("image/png");
  });

  it("rejects unsupported mimes", () => {
    expect(() => assertSupportedAssetMime("image/heic")).toThrow(/Unsupported/);
    expect(() => assertSupportedAssetMime("image/gif")).toThrow(/Unsupported/);
    expect(() => assertSupportedAssetMime("image/jpeg")).not.toThrow();
  });

  it("coerceAssetBlob wraps ArrayBuffer and keeps Blob", () => {
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    const fromBuf = coerceAssetBlob(bytes, "image/png");
    expect(fromBuf).toBeInstanceOf(Blob);
    expect(fromBuf?.size).toBe(4);
    expect(fromBuf?.type).toBe("image/png");

    const blob = new Blob([bytes], { type: "image/jpeg" });
    expect(coerceAssetBlob(blob, "image/jpeg")).toBe(blob);
    expect(coerceAssetBlob(new Blob([], { type: "image/png" }), "image/png")).toBeNull();
  });

  it("normalizeAssetRow wraps ArrayBuffer payload into Blob", () => {
    const bytes = new Uint8Array([9, 8, 7]).buffer;
    const row = {
      id: "a1",
      name: "x.jpg",
      mime: "image/jpeg",
      kind: "image",
      blob: bytes as unknown as Blob,
      createdAt: "2020-01-01T00:00:00.000Z",
    } satisfies WorkspaceAsset;
    const normalized = normalizeAssetRow(row);
    expect(normalized.blob).toBeInstanceOf(Blob);
    expect(normalized.blob.size).toBe(3);
    expect(normalized.blob.type).toBe("image/jpeg");
  });

  it("buildWorkspaceAssetFromFile stores a Blob copy (not File) with correct size/type", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "asset-test" });
    const bytes = new Uint8Array([137, 80, 78, 71, 0, 1, 2, 3]);
    const file = new File([bytes], "hero.png", { type: "image/png" });
    const asset = await buildWorkspaceAssetFromFile({ file, kind: "image", id: "asset-1" });

    expect(asset.id).toBe("asset-1");
    expect(asset.name).toBe("hero.png");
    expect(asset.mime).toBe("image/png");
    expect(asset.blob).toBeInstanceOf(Blob);
    expect(asset.blob).not.toBe(file);
    expect(asset.blob instanceof File).toBe(false);
    expect(asset.blob.size).toBe(bytes.byteLength);
    expect(asset.blob.type).toBe("image/png");
    expect(new Uint8Array(await asset.blob.arrayBuffer())).toEqual(bytes);
  });

  it("buildWorkspaceAssetFromFile infers jpeg mime from extension", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    const file = new File([bytes], "frame.jpg", { type: "" });
    const asset = await buildWorkspaceAssetFromFile({ file });
    expect(asset.mime).toBe("image/jpeg");
    expect(asset.blob.type).toBe("image/jpeg");
    expect(asset.blob.size).toBe(4);
  });

  it("buildWorkspaceAssetFromFile rejects HEIC / empty", async () => {
    await expect(
      buildWorkspaceAssetFromFile({
        file: new File([new Uint8Array([1])], "x.heic", { type: "image/heic" }),
      }),
    ).rejects.toThrow(/Unsupported/);

    await expect(
      buildWorkspaceAssetFromFile({
        file: new File([], "empty.jpg", { type: "image/jpeg" }),
      }),
    ).rejects.toThrow(/Empty/);
  });
});
