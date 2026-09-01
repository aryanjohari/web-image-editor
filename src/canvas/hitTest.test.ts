import { describe, expect, it } from "vitest";
import {
  applyDragDelta,
  cssToNdc,
  hitTestSelection,
  objectNdcRect,
  selectionScreenRect,
} from "./index";
import { identityOverlayImage, identityText, recipeWithMain } from "../recipe/identityRecipe";
import { validateRecipe } from "../recipe/validate";

describe("cssToNdc", () => {
  it("maps corners correctly", () => {
    expect(cssToNdc(0, 0, 200, 100)).toEqual({ x: -1, y: 1 });
    expect(cssToNdc(200, 100, 200, 100)).toEqual({ x: 1, y: -1 });
    expect(cssToNdc(100, 50, 200, 100).x).toBeCloseTo(0);
    expect(cssToNdc(100, 50, 200, 100).y).toBeCloseTo(0);
  });
});

describe("applyDragDelta", () => {
  it("moves x/y and clamps", () => {
    const next = applyDragDelta(
      { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      0.1,
      0.2,
    );
    expect(next.x).toBeCloseTo(0.1);
    expect(next.y).toBeCloseTo(0.2);
  });
});

describe("hitTestSelection", () => {
  it("prefers text over overlay", () => {
    const recipe = validateRecipe({
      ...recipeWithMain("m"),
      objects: [
        ...recipeWithMain("m").objects,
        identityOverlayImage("o"),
        identityText("Hi"),
      ],
    });
    // Text default y=-0.35; probe near that center
    const hit = hitTestSelection(recipe, 0, -0.35, {
      viewW: 400,
      viewH: 400,
      overlay: { width: 400, height: 400 },
    });
    expect(hit).toBe("text");
  });

  it("hits overlay when text absent", () => {
    const recipe = validateRecipe({
      ...recipeWithMain("m"),
      objects: [...recipeWithMain("m").objects, identityOverlayImage("o")],
    });
    const hit = hitTestSelection(recipe, 0, 0, {
      viewW: 400,
      viewH: 400,
      overlay: { width: 400, height: 400 },
    });
    expect(hit).toBe("overlay");
  });

  it("returns null on empty click", () => {
    const recipe = recipeWithMain("m");
    expect(
      hitTestSelection(recipe, 0.9, 0.9, { viewW: 400, viewH: 400 }),
    ).toBeNull();
  });
});

describe("selectionScreenRect", () => {
  it("produces positive screen box for text", () => {
    const recipe = validateRecipe({
      ...recipeWithMain("m"),
      objects: [...recipeWithMain("m").objects, identityText("Prism")],
    });
    const rect = selectionScreenRect(recipe, "text", { viewW: 400, viewH: 300 });
    expect(rect).not.toBeNull();
    expect(rect!.width).toBeGreaterThan(1);
    expect(rect!.height).toBeGreaterThan(1);
  });
});

describe("objectNdcRect", () => {
  it("centers at transform offset", () => {
    const r = objectNdcRect(
      { x: 0.2, y: -0.1, scaleX: 1, scaleY: 1, rotation: 0 },
      { width: 100, height: 100 },
      100,
      100,
    );
    expect((r.left + r.right) / 2).toBeCloseTo(0.2);
    expect((r.top + r.bottom) / 2).toBeCloseTo(-0.1);
  });
});
