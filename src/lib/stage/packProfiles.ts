/**
 * Stage v1 campaign pack profiles — Phase 0 freeze.
 * @see docs/DIRECTION.md
 */

export type StagePackProfile = {
  id: string;
  label: string;
  /** Pixel width for still / loop export; null = live recipe only */
  width: number | null;
  height: number | null;
  kind: "still" | "live_recipe";
  description: string;
};

/** Default stills included in a campaign pack export. */
export const STAGE_DEFAULT_PACK_PROFILE_IDS = [
  "square",
  "story",
  "web_hero",
] as const;

export type StageDefaultPackProfileId = (typeof STAGE_DEFAULT_PACK_PROFILE_IDS)[number];

export const STAGE_PACK_PROFILES: readonly StagePackProfile[] = [
  {
    id: "square",
    label: "Feed / 1:1",
    width: 1080,
    height: 1080,
    kind: "still",
    description: "Instagram / Facebook feed still",
  },
  {
    id: "story",
    label: "Story / 9:16",
    width: 1080,
    height: 1920,
    kind: "still",
    description: "Stories, Reels cover, vertical social",
  },
  {
    id: "web_hero",
    label: "Web hero / 16:9",
    width: 1920,
    height: 1080,
    kind: "still",
    description: "Site hero poster / landscape still",
  },
  {
    id: "web_hero_live",
    label: "Live background recipe",
    width: null,
    height: null,
    kind: "live_recipe",
    description: "JSON recipe + embed playback (not a fixed PNG size)",
  },
] as const;

export function getPackProfile(id: string): StagePackProfile | undefined {
  return STAGE_PACK_PROFILES.find((p) => p.id === id);
}

export function listStillPackProfiles(): StagePackProfile[] {
  return STAGE_PACK_PROFILES.filter((p) => p.kind === "still");
}
