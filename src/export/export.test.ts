import { describe, expect, it } from "vitest";
import { identityRecipe, recipeWithMain } from "../recipe/identityRecipe";
import { validateRecipe } from "../recipe/validate";
import {
  HASH_BUDGET_CHARS,
  decodeRecipeHash,
  encodeRecipeHash,
  flipYRgba,
  listMissingAssets,
  ShareHashError,
} from "./index";

describe("shareHash", () => {
  it("round-trips a recipe through #r= zlib+base64url", () => {
    const recipe = validateRecipe({
      ...recipeWithMain("main-abc"),
      packId: "warm-film",
      packVersion: "1.0.0",
    });
    const hash = encodeRecipeHash(recipe);
    expect(hash.startsWith("#r=")).toBe(true);
    expect(hash.length - 3).toBeLessThanOrEqual(HASH_BUDGET_CHARS);
    const back = decodeRecipeHash(hash);
    expect(back.packId).toBe("warm-film");
    expect(back.objects[0]).toMatchObject({
      kind: "image",
      role: "main",
      source: { type: "id", assetId: "main-abc" },
    });
  });

  it("refuses over-budget payloads", () => {
    const recipe = recipeWithMain("main-abc");
    // Cryptographic noise — zlib cannot crush under the 12 KiB budget.
    const bytes = crypto.getRandomValues(new Uint8Array(48_000));
    let noise = "";
    for (let i = 0; i < bytes.length; i++) noise += String.fromCharCode(bytes[i]!);
    const fat = validateRecipe({
      ...recipe,
      meta: { notes: noise },
    });
    expect(() => encodeRecipeHash(fat)).toThrow(ShareHashError);
  });
});

describe("listMissingAssets", () => {
  it("lists unresolved id refs for visible images (F3/F4)", () => {
    const recipe = recipeWithMain("main-missing");
    const missing = listMissingAssets(recipe, new Map());
    expect(missing).toEqual([
      { objectId: "main", role: "main", assetId: "main-missing" },
    ]);
  });

  it("returns empty when assets resolve", () => {
    const recipe = recipeWithMain("main-ok");
    const map = new Map([
      [
        "main-ok",
        {
          assetId: "main-ok",
          blob: new Blob(),
          mime: "image/png",
          createdAt: new Date().toISOString(),
        },
      ],
    ]);
    expect(listMissingAssets(recipe, map)).toEqual([]);
  });

  it("lists missing mask asset on main (F3)", () => {
    const recipe = validateRecipe({
      ...recipeWithMain("main-ok"),
      engineVersion: "0.2.0",
      objects: [
        {
          ...recipeWithMain("main-ok").objects[0]!,
          maskRef: { type: "id", assetId: "mask-missing" },
          regional: { subject: { effects: [] }, background: { effects: [] } },
        },
      ],
    });
    const map = new Map([
      [
        "main-ok",
        {
          assetId: "main-ok",
          blob: new Blob(),
          mime: "image/png",
          createdAt: new Date().toISOString(),
        },
      ],
    ]);
    expect(listMissingAssets(recipe, map)).toEqual([
      { objectId: "main", role: "mask", assetId: "mask-missing" },
    ]);
  });
});

describe("flipYRgba", () => {
  it("flips rows for GL → Canvas2D", () => {
    // GL bottom-up: index 0 is bottom-left (values 3,4 then 1,2).
    const gl = new Uint8Array([
      3, 0, 0, 255, 4, 0, 0, 255,
      1, 0, 0, 255, 2, 0, 0, 255,
    ]);
    const out = flipYRgba(gl, 2, 2);
    expect([...out.slice(0, 4)]).toEqual([1, 0, 0, 255]);
    expect([...out.slice(4, 8)]).toEqual([2, 0, 0, 255]);
    expect([...out.slice(8, 12)]).toEqual([3, 0, 0, 255]);
    expect([...out.slice(12, 16)]).toEqual([4, 0, 0, 255]);
  });
});

describe("identity still validates", () => {
  it("empty identity recipe validates", () => {
    expect(validateRecipe(identityRecipe()).objects).toEqual([]);
  });
});
