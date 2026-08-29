import { describe, expect, it } from "vitest";
import { recipeWithMain } from "../recipe/identityRecipe";
import {
  RecipeValidationError,
  engineSupportsRegional,
  validateRecipe,
} from "../recipe/validate";
import { ENGINE_VERSION, SCHEMA_VERSION } from "../recipe/types";

describe("engineSupportsRegional", () => {
  it("gates at 0.2.0", () => {
    expect(engineSupportsRegional("0.1.0")).toBe(false);
    expect(engineSupportsRegional("0.2.0")).toBe(true);
    expect(engineSupportsRegional("0.3.1")).toBe(true);
  });
});

describe("validateRecipe regional (M05)", () => {
  function regionalMain(maskId = "mask-1") {
    return {
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
          source: { type: "id", assetId: "photo-1" },
          maskRef: { type: "id", assetId: maskId },
          regional: { subject: { effects: [] }, background: { effects: [] } },
        },
      ],
    };
  }

  it("accepts main with maskRef + regional at 0.2.0", () => {
    const r = validateRecipe(regionalMain());
    const main = r.objects[0];
    expect(main?.kind === "image" && main.maskRef?.type === "id" && main.maskRef.assetId).toBe(
      "mask-1",
    );
    expect(main?.kind === "image" && main.regional?.subject.effects).toEqual([]);
  });

  it("rejects maskRef below 0.2.0", () => {
    const raw = regionalMain();
    (raw as { engineVersion: string }).engineVersion = "0.1.0";
    expect(() => validateRecipe(raw)).toThrow(/maskRef/i);
  });

  it("requires regional when maskRef active", () => {
    const raw = regionalMain();
    delete (raw.objects[0] as { regional?: unknown }).regional;
    expect(() => validateRecipe(raw)).toThrow(/regional/i);
  });

  it("rejects maskRef on overlay", () => {
    const raw = {
      ...regionalMain(),
      objects: [
        regionalMain().objects[0]!,
        {
          id: "overlay",
          kind: "image",
          role: "overlay",
          z: 1,
          visible: true,
          opacity: 1,
          blend: "normal",
          transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          effects: [],
          source: { type: "id", assetId: "ov-1" },
          maskRef: { type: "id", assetId: "mask-2" },
        },
      ],
    };
    expect(() => validateRecipe(raw)).toThrow(/maskRef/i);
  });

  it("Tier A recipe without mask still validates", () => {
    const raw = recipeWithMain("a");
    raw.engineVersion = "0.1.0";
    expect(validateRecipe(raw).objects[0]?.effects).toEqual([]);
  });

  it("rejects second mask", () => {
    const raw = regionalMain();
    raw.objects.push({
      ...regionalMain().objects[0]!,
      id: "ghost",
      visible: false,
      maskRef: { type: "id", assetId: "mask-2" },
    });
    expect(() => validateRecipe(raw)).toThrow(/one maskRef/i);
  });

  it("rejects regional without maskRef", () => {
    const raw = regionalMain();
    delete (raw.objects[0] as { maskRef?: unknown }).maskRef;
    try {
      validateRecipe(raw);
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RecipeValidationError);
      expect((e as RecipeValidationError).code).toBe("MASK_REQUIRED");
    }
  });
});
