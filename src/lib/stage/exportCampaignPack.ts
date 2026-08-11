/**
 * Stage Phase 3 — campaign pack export (still profiles + StageRecipe JSON → ZIP).
 */

import { captureCanvasPngAtSize, PackCaptureError } from "@/lib/export/captureCanvasAtSize";
import { zipToBlob, type ZipEntry } from "@/lib/export/zipStore";
import {
  STAGE_DEFAULT_PACK_PROFILE_IDS,
  getPackProfile,
  type StagePackProfile,
} from "./packProfiles";
import { gatherStageRecipeExport, recipeToJson } from "./applyRecipe";

export { PackCaptureError };

export type CampaignPackStillArtifact = {
  profileId: string;
  filename: string;
  width: number;
  height: number;
  bytes: Uint8Array;
};

export type CampaignPackArtifact =
  | CampaignPackStillArtifact
  | { kind: "recipe"; filename: string; json: string }
  | { kind: "note"; filename: string; text: string };

export type BuildCampaignPackOptions = {
  canvas: HTMLCanvasElement;
  /** Require hero texture — same rule as PNG poster export. */
  hasHeroTexture: boolean;
  includeImagesInRecipe?: boolean;
  profileIds?: readonly string[];
  /**
   * Inject PNG captures for tests (profileId → bytes).
   * When omitted, live canvas is resized and captured.
   */
  capturePng?: (profile: StagePackProfile & { width: number; height: number }) => Promise<Uint8Array>;
  gatherRecipeJson?: () => Promise<string>;
};

export type CampaignPackBuildResult = {
  entries: ZipEntry[];
  artifacts: CampaignPackArtifact[];
  zipFilename: string;
};

export const STAGE_RECIPE_PACK_FILENAME = "stage-recipe.json";
export const WEB_HERO_LIVE_NOTE_FILENAME = "web_hero_live.txt";
export const CAMPAIGN_PACK_ZIP_FILENAME = "campaign-pack.zip";

export const WEB_HERO_LIVE_NOTE = [
  "web_hero_live is not a fixed PNG size.",
  "Use stage-recipe.json (StageRecipe schema v3) with the preset embed path for live background playback.",
  "See src/lib/preset/PORTING.md and docs/DIRECTION.md pack profiles.",
].join("\n");

export function stillPackFilename(profileId: string, width: number, height: number): string {
  return `pack-${profileId}-${width}x${height}.png`;
}

/** Resolve default still profiles (exact pixel sizes) from frozen pack catalog. */
export function resolveDefaultStillPackProfiles(
  profileIds: readonly string[] = STAGE_DEFAULT_PACK_PROFILE_IDS,
): Array<StagePackProfile & { width: number; height: number }> {
  const out: Array<StagePackProfile & { width: number; height: number }> = [];
  for (const id of profileIds) {
    const profile = getPackProfile(id);
    if (!profile) {
      throw new PackCaptureError(`Unknown pack profile: ${id}`);
    }
    if (profile.kind !== "still" || profile.width == null || profile.height == null) {
      throw new PackCaptureError(`Pack profile "${id}" is not a still size.`);
    }
    out.push({ ...profile, width: profile.width, height: profile.height });
  }
  return out;
}

export async function buildCampaignPackArtifacts(
  options: BuildCampaignPackOptions,
): Promise<CampaignPackBuildResult> {
  if (!options.hasHeroTexture) {
    throw new PackCaptureError("Upload a hero texture first.");
  }

  const profiles = resolveDefaultStillPackProfiles(options.profileIds);
  const artifacts: CampaignPackArtifact[] = [];
  const entries: ZipEntry[] = [];

  const capture =
    options.capturePng ??
    (async (profile) => captureCanvasPngAtSize(options.canvas, profile.width, profile.height));

  for (const profile of profiles) {
    const bytes = await capture(profile);
    const filename = stillPackFilename(profile.id, profile.width, profile.height);
    artifacts.push({
      profileId: profile.id,
      filename,
      width: profile.width,
      height: profile.height,
      bytes,
    });
    entries.push({ name: filename, data: bytes });
  }

  const recipeJson =
    options.gatherRecipeJson ??
    (async () => {
      const recipe = await gatherStageRecipeExport(
        options.canvas,
        options.includeImagesInRecipe ?? false,
      );
      return recipeToJson(recipe);
    });

  const json = await recipeJson();
  artifacts.push({ kind: "recipe", filename: STAGE_RECIPE_PACK_FILENAME, json });
  entries.push({ name: STAGE_RECIPE_PACK_FILENAME, data: new TextEncoder().encode(json) });

  artifacts.push({
    kind: "note",
    filename: WEB_HERO_LIVE_NOTE_FILENAME,
    text: WEB_HERO_LIVE_NOTE,
  });
  entries.push({
    name: WEB_HERO_LIVE_NOTE_FILENAME,
    data: new TextEncoder().encode(WEB_HERO_LIVE_NOTE),
  });

  return {
    entries,
    artifacts,
    zipFilename: CAMPAIGN_PACK_ZIP_FILENAME,
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build pack ZIP and trigger browser download. */
export async function downloadCampaignPack(options: BuildCampaignPackOptions): Promise<void> {
  const { entries, zipFilename } = await buildCampaignPackArtifacts(options);
  downloadBlob(zipToBlob(entries), zipFilename);
}
