import { describe, expect, it } from "vitest";
import { STAGE_DEFAULT_PACK_PROFILE_IDS, STAGE_PACK_PROFILES, getPackProfile, listStillPackProfiles } from "./packProfiles";
import { parseBrandKit, parseJobRequest, parseStageRecipe } from "./parse";
import { STAGE_RECIPE_SCHEMA_VERSION } from "./types";
import { createDefaultStageLayerEffects, createEmptyBrandKit } from "./index";

describe("Stage Phase 0 pack profiles", () => {
  it("includes default still pack ids", () => {
    for (const id of STAGE_DEFAULT_PACK_PROFILE_IDS) {
      const p = getPackProfile(id);
      expect(p).toBeDefined();
      expect(p!.kind).toBe("still");
      expect(p!.width).toBeGreaterThan(0);
      expect(p!.height).toBeGreaterThan(0);
    }
  });

  it("lists three still profiles and one live recipe profile", () => {
    expect(listStillPackProfiles()).toHaveLength(3);
    expect(STAGE_PACK_PROFILES.some((p) => p.id === "web_hero_live" && p.kind === "live_recipe")).toBe(
      true,
    );
  });
});

describe("Stage Phase 0 parsers", () => {
  it("accepts a minimal brand kit", () => {
    const kit = createEmptyBrandKit({ id: "brand_demo", name: "Demo" });
    const parsed = parseBrandKit(kit);
    expect(parsed.ok).toBe(true);
  });

  it("rejects brand kit without name", () => {
    const parsed = parseBrandKit({ id: "x", colors: [], fonts: [] });
    expect(parsed.ok).toBe(false);
  });

  it("accepts a minimal recipe", () => {
    const recipe = {
      recipeSchemaVersion: STAGE_RECIPE_SCHEMA_VERSION,
      engineVersion: "0.0.0-phase0",
      layers: [],
      assets: {},
      viewport: {
        drawBufferWidth: 1920,
        drawBufferHeight: 1080,
        cssWidth: 1920,
        cssHeight: 1080,
        dpr: 1,
      },
      baseTimeSeconds: 0,
    };
    expect(parseStageRecipe(recipe).ok).toBe(true);
  });

  it("rejects wrong recipe schema version", () => {
    const parsed = parseStageRecipe({
      recipeSchemaVersion: 2,
      engineVersion: "x",
      layers: [],
      assets: {},
      viewport: {},
      baseTimeSeconds: 0,
    });
    expect(parsed.ok).toBe(false);
  });

  it("accepts a job request", () => {
    expect(parseJobRequest({ brandId: "b1", brief: "Winter sale posters" }).ok).toBe(true);
  });

  it("exports default layer effects aligned with engine-ish defaults", () => {
    expect(createDefaultStageLayerEffects().meltIntensity).toBe(0.15);
  });
});
