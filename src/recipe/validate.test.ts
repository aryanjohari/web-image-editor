import { describe, expect, it } from "vitest";
import { identityRecipe, recipeWithMain } from "./identityRecipe";
import { RecipeValidationError, validateRecipe } from "./validate";
import { SCHEMA_VERSION, ENGINE_VERSION } from "./types";

describe("validateRecipe", () => {
  it("accepts identity / main recipe", () => {
    const r = validateRecipe(recipeWithMain("asset-1"));
    expect(r.schemaVersion).toBe(SCHEMA_VERSION);
    expect(r.objects).toHaveLength(1);
    expect(r.objects[0]?.kind).toBe("image");
  });

  it("rejects unsupported schemaVersion", () => {
    expect(() =>
      validateRecipe({ ...identityRecipe(), schemaVersion: "999" }),
    ).toThrow(RecipeValidationError);
  });

  it("rejects inline asset bytes", () => {
    const raw = {
      schemaVersion: SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      packId: null,
      packVersion: null,
      objects: [
        {
          id: "main",
          kind: "image",
          role: "main",
          z: 0,
          visible: true,
          opacity: 1,
          blend: "normal",
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          effects: [],
          source: { type: "inline", data: "abc" },
        },
      ],
    };
    expect(() => validateRecipe(raw)).toThrow(/inline/i);
  });

  it("rejects OOR opacity (no silent clamp)", () => {
    const raw = recipeWithMain("a");
    raw.objects[0]!.opacity = 1.5;
    try {
      validateRecipe(raw);
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RecipeValidationError);
      expect((e as RecipeValidationError).code).toBe("OOR");
    }
  });

  it("rejects second active main (cap)", () => {
    const raw = {
      schemaVersion: SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      packId: null,
      packVersion: null,
      objects: [
        {
          id: "m1",
          kind: "image",
          role: "main",
          z: 0,
          visible: true,
          opacity: 1,
          blend: "normal",
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          effects: [],
          source: { type: "id", assetId: "a" },
        },
        {
          id: "m2",
          kind: "image",
          role: "main",
          z: 1,
          visible: true,
          opacity: 1,
          blend: "normal",
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          effects: [],
          source: { type: "id", assetId: "b" },
        },
      ],
    };
    expect(() => validateRecipe(raw)).toThrow(/at most 1 active main/i);
  });

  it("rejects unknown effect id", () => {
    const raw = recipeWithMain("a");
    raw.objects[0]!.effects = [{ id: "bloom", params: { amount: 1 } }];
    expect(() => validateRecipe(raw)).toThrow(/unknown effect/i);
  });

  it("rejects text with effects", () => {
    const raw = {
      schemaVersion: SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      packId: null,
      packVersion: null,
      objects: [
        {
          id: "t1",
          kind: "text",
          z: 0,
          visible: true,
          opacity: 1,
          blend: "normal",
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          effects: [{ id: "grain", params: { amount: 0.2 } }],
          text: {
            content: "Hi",
            fontFamily: "sans-serif",
            fontWeight: 400,
            fontSize: 24,
            color: "#fff",
          },
        },
      ],
    };
    expect(() => validateRecipe(raw)).toThrow(/effects:\s*\[\]/i);
  });

  it("rejects unsupported active kind", () => {
    const raw = {
      schemaVersion: SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      packId: null,
      packVersion: null,
      objects: [
        {
          id: "s1",
          kind: "shape",
          z: 0,
          visible: true,
          opacity: 1,
          blend: "normal",
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          effects: [],
        },
      ],
    };
    expect(() => validateRecipe(raw)).toThrow(/unsupported active object kind/i);
  });

  it("rejects effect param OOR", () => {
    const raw = recipeWithMain("a");
    raw.objects[0]!.effects = [{ id: "grain", params: { amount: 9 } }];
    try {
      validateRecipe(raw);
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RecipeValidationError);
      expect((e as RecipeValidationError).code).toBe("OOR");
    }
  });

  it("admits blur and grain.size in range", () => {
    const raw = recipeWithMain("a");
    raw.objects[0]!.effects = [
      { id: "blur", params: { amount: 0.4 } },
      { id: "grain", params: { amount: 0.3, size: 0.6 } },
    ];
    const r = validateRecipe(raw);
    expect(r.objects[0]?.effects).toHaveLength(2);
  });

  it("rejects blur OOR", () => {
    const raw = recipeWithMain("a");
    raw.objects[0]!.effects = [{ id: "blur", params: { amount: 2 } }];
    expect(() => validateRecipe(raw)).toThrow(/out of range/i);
  });

  it("round-trips JSON", () => {
    const r = validateRecipe(recipeWithMain("x"));
    const again = validateRecipe(JSON.parse(JSON.stringify(r)));
    expect(again).toEqual(r);
  });
});
