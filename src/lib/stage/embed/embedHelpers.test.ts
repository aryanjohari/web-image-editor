import { describe, expect, it } from "vitest";
import {
  getEmbedLayerStyle,
  prefersReducedMotion,
  shouldFreezeEmbedMotion,
} from "./embedHelpers";

describe("embedHelpers", () => {
  it("returns pointer-events none full-bleed styles", () => {
    const s = getEmbedLayerStyle();
    expect(s.pointerEvents).toBe("none");
    expect(s.position).toBe("fixed");
    expect(s.inset).toBe("0");
  });

  it("detects reduced motion via injectable matchMedia", () => {
    expect(prefersReducedMotion(() => ({ matches: true }))).toBe(true);
    expect(prefersReducedMotion(() => ({ matches: false }))).toBe(false);
  });

  it("shouldFreezeEmbedMotion respects forceFreeze and media", () => {
    expect(shouldFreezeEmbedMotion({ forceFreeze: true })).toBe(true);
    expect(shouldFreezeEmbedMotion({ forceFreeze: false })).toBe(false);
    expect(
      shouldFreezeEmbedMotion({ matchMedia: () => ({ matches: true }) }),
    ).toBe(true);
  });
});
