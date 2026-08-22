import { beforeEach, describe, expect, it } from "vitest";
import { AssetStoreError } from "./errors";
import { deleteAsset, getAsset, listAssets, putAsset } from "./idb";

describe("assets idb", () => {
  beforeEach(async () => {
    // Wipe DB between tests via deleting known keys after list
    const existing = await listAssets();
    for (const a of existing) {
      await deleteAsset(a.assetId);
    }
  });

  it("puts and gets a Blob", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    await putAsset("img-1", blob, { name: "test.png", width: 10, height: 8 });
    const got = await getAsset("img-1");
    expect(got.assetId).toBe("img-1");
    expect(got.mime).toBe("image/png");
    expect(got.width).toBe(10);
    expect(got.name).toBe("test.png");
    expect(got.blob.size).toBe(3);
  });

  it("lists assets without requiring blob in meta view", async () => {
    await putAsset("a", new Blob(["x"], { type: "image/jpeg" }));
    await putAsset("b", new Blob(["y"], { type: "image/jpeg" }));
    const list = await listAssets();
    expect(list.map((x) => x.assetId).sort()).toEqual(["a", "b"]);
  });

  it("deletes assets", async () => {
    await putAsset("z", new Blob(["z"]));
    await deleteAsset("z");
    await expect(getAsset("z")).rejects.toMatchObject({ code: "MISSING" });
  });

  it("throws loud MISSING for unknown id", async () => {
    try {
      await getAsset("does-not-exist");
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(AssetStoreError);
      expect((e as AssetStoreError).code).toBe("MISSING");
      expect((e as AssetStoreError).assetId).toBe("does-not-exist");
    }
  });
});
