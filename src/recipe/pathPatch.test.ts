import { describe, expect, it } from "vitest";
import {
  identityOverlayImage,
  identityText,
  recipeWithMain,
} from "./identityRecipe";
import { PathPatchError, applyPathPatch } from "./pathPatch";
import { validateRecipe } from "./validate";

describe("applyPathPatch", () => {
  it("patches opacity by object id", () => {
    const base = recipeWithMain("a");
    const next = applyPathPatch(base, [{ path: "/objects/main/opacity", value: 0.5 }]);
    expect(next.objects[0]?.opacity).toBe(0.5);
    expect(base.objects[0]?.opacity).toBe(1);
  });

  it("patches text content", () => {
    const base = validateRecipe({
      ...recipeWithMain("a"),
      objects: [recipeWithMain("a").objects[0]!, identityText("Hello")],
    });
    const next = applyPathPatch(base, [
      { path: "/objects/text/text/content", value: "World" },
    ]);
    const text = next.objects.find((o) => o.kind === "text");
    expect(text?.kind === "text" && text.text.content).toBe("World");
  });

  it("rejects non-allowlisted path", () => {
    const base = recipeWithMain("a");
    expect(() =>
      applyPathPatch(base, [{ path: "/schemaVersion", value: "2" }]),
    ).toThrow(PathPatchError);
    try {
      applyPathPatch(base, [{ path: "/objects/main/effects", value: [] }]);
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(PathPatchError);
      expect((e as PathPatchError).code).toBe("ALLOWLIST");
    }
  });

  it("fails closed on OOR value after merge", () => {
    const base = recipeWithMain("a");
    try {
      applyPathPatch(base, [{ path: "/objects/main/opacity", value: 2 }]);
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(PathPatchError);
      expect((e as PathPatchError).code).toBe("OOR");
    }
  });

  it("patches effect params when present", () => {
    const base = recipeWithMain("a");
    base.objects[0]!.effects = [{ id: "grain", params: { amount: 0.1 } }];
    const validated = validateRecipe(base);
    const next = applyPathPatch(validated, [
      { path: "/objects/main/effects/0/params/amount", value: 0.8 },
    ]);
    expect(next.objects[0]?.effects[0]?.params.amount).toBe(0.8);
  });

  it("can set overlay blend", () => {
    const base = validateRecipe({
      ...recipeWithMain("a"),
      objects: [recipeWithMain("a").objects[0]!, identityOverlayImage("b")],
    });
    const next = applyPathPatch(base, [
      { path: "/objects/overlay/blend", value: "multiply" },
    ]);
    const overlay = next.objects.find((o) => o.kind === "image" && o.role === "overlay");
    expect(overlay?.blend).toBe("multiply");
  });
});
