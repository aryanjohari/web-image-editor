import { describe, expect, it } from "vitest";
import { buildZipStore } from "@/lib/export/zipStore";
import {
  STAGE_DEFAULT_PACK_PROFILE_IDS,
  STAGE_RECIPE_PACK_FILENAME,
  WEB_HERO_LIVE_NOTE_FILENAME,
  buildCampaignPackArtifacts,
  resolveDefaultStillPackProfiles,
  stillPackFilename,
  PackCaptureError,
} from "@/lib/stage";

describe("campaign pack filenames + profiles", () => {
  it("builds pack filenames from profile id and size", () => {
    expect(stillPackFilename("square", 1080, 1080)).toBe("pack-square-1080x1080.png");
    expect(stillPackFilename("story", 1080, 1920)).toBe("pack-story-1080x1920.png");
    expect(stillPackFilename("web_hero", 1920, 1080)).toBe("pack-web_hero-1920x1080.png");
  });

  it("resolves default still profiles from STAGE_DEFAULT_PACK_PROFILE_IDS", () => {
    const profiles = resolveDefaultStillPackProfiles();
    expect(profiles.map((p) => p.id)).toEqual([...STAGE_DEFAULT_PACK_PROFILE_IDS]);
    expect(profiles).toEqual([
      expect.objectContaining({ id: "square", width: 1080, height: 1080 }),
      expect.objectContaining({ id: "story", width: 1080, height: 1920 }),
      expect.objectContaining({ id: "web_hero", width: 1920, height: 1080 }),
    ]);
  });

  it("rejects live_recipe profile ids for still capture", () => {
    expect(() => resolveDefaultStillPackProfiles(["web_hero_live"])).toThrow(PackCaptureError);
  });
});

describe("buildCampaignPackArtifacts", () => {
  it("alerts via throw when hero texture is missing", async () => {
    await expect(
      buildCampaignPackArtifacts({
        canvas: {} as HTMLCanvasElement,
        hasHeroTexture: false,
      }),
    ).rejects.toThrow("Upload a hero texture first.");
  });

  it("builds artifact list with mocked captures (no GPU)", async () => {
    const fakePng = new Uint8Array([137, 80, 78, 71]);
    const captured: string[] = [];

    const result = await buildCampaignPackArtifacts({
      canvas: {} as HTMLCanvasElement,
      hasHeroTexture: true,
      capturePng: async (profile) => {
        captured.push(`${profile.id}:${profile.width}x${profile.height}`);
        return fakePng;
      },
      gatherRecipeJson: async () => '{"recipeSchemaVersion":3}',
    });

    expect(captured).toEqual([
      "square:1080x1080",
      "story:1080x1920",
      "web_hero:1920x1080",
    ]);
    expect(result.zipFilename).toBe("campaign-pack.zip");
    expect(result.entries.map((e) => e.name)).toEqual([
      "pack-square-1080x1080.png",
      "pack-story-1080x1920.png",
      "pack-web_hero-1920x1080.png",
      STAGE_RECIPE_PACK_FILENAME,
      WEB_HERO_LIVE_NOTE_FILENAME,
    ]);
    expect(result.entries[0]!.data).toEqual(fakePng);

    const zip = buildZipStore(result.entries);
    // Local file header signature
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(zip[2]).toBe(0x03);
    expect(zip[3]).toBe(0x04);
    expect(zip.byteLength).toBeGreaterThan(100);
  });
});
