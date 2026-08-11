import type { SynthPresetV2 } from "../lib/preset/types";
import {
  BG_CLEAN_LOOP,
  BG_FILM_GRAIN,
  BG_NIGHT_GRADIENT,
  BG_SOFT_DRIFT,
} from "./backgroundPresets";
import {
  IDEA_ACID_NOIR,
  IDEA_ARCHIVE,
  IDEA_COLD_SCAN,
  IDEA_GLITCH,
  IDEA_RAW_ZINE,
  IDEA_SOFT_BLOOM,
  IDEA_STROBE_HAZE,
  IDEA_SUNSET_MELT,
  IDEA_TAPE_WORN,
  IDEA_XEROX_PUNK,
} from "./demoIdeasPresets";

export type PresetCategory = "featured" | "legacy";

export type PresetCatalogEntry = {
  id: string;
  label: string;
  keywords: string[];
  preset: SynthPresetV2;
  description?: string;
  category: PresetCategory;
};

export const FEATURED_PRESETS: PresetCatalogEntry[] = [
  {
    id: "soft-drift",
    label: "Soft Drift",
    keywords: ["drift", "float", "ambient", "calm", "slow", "soft"],
    preset: BG_SOFT_DRIFT,
    description: "Gentle blue-gray drift with very slow motion — site-safe hero default.",
    category: "featured",
  },
  {
    id: "film-grain",
    label: "Film Grain",
    keywords: ["grain", "film", "texture", "analog", "subtle"],
    preset: BG_FILM_GRAIN,
    description: "Warm analog grain and soft scanlines for cinematic portfolios.",
    category: "featured",
  },
  {
    id: "night-gradient",
    label: "Night Gradient",
    keywords: ["night", "dark", "cinematic", "moody", "navy", "dusk"],
    preset: BG_NIGHT_GRADIENT,
    description: "Deep navy dusk gradient with slow, moody drift.",
    category: "featured",
  },
  {
    id: "archive",
    label: "Archive",
    keywords: ["archival", "vintage", "warm", "halftone", "print", "offset", "calm", "ambient", "paper"],
    preset: IDEA_ARCHIVE,
    description: "Slow halftone posterization with warm paper tones.",
    category: "featured",
  },
  {
    id: "soft-bloom",
    label: "Soft Bloom",
    keywords: ["soft", "dreamy", "bloom", "pastel", "gentle", "haze", "mist", "calm"],
    preset: IDEA_SOFT_BLOOM,
    description: "Lavender/pink duotone with very slow, soft bleed.",
    category: "featured",
  },
  {
    id: "sunset-melt",
    label: "Sunset Melt",
    keywords: ["sunset", "warm", "golden", "slow", "glow", "melt"],
    preset: IDEA_SUNSET_MELT,
    description: "Warm orange glow with slow drift — embed-friendly melt.",
    category: "featured",
  },
  {
    id: "clean-loop",
    label: "Clean Loop",
    keywords: ["minimal", "clean", "simple", "loop", "subtle", "seamless"],
    preset: BG_CLEAN_LOOP,
    description: "Minimal cool-toned loop with clean, seamless motion.",
    category: "featured",
  },
];

export const LEGACY_PRESETS: PresetCatalogEntry[] = [
  {
    id: "acid-noir",
    label: "Acid Noir",
    keywords: ["acid", "neon", "noir", "flyer", "contrast", "duotone"],
    preset: IDEA_ACID_NOIR,
    description: "High-contrast neon duotone bleed with linked motion.",
    category: "legacy",
  },
  {
    id: "glitch-core",
    label: "Glitch Core",
    keywords: ["glitch", "digital", "decay", "scanlines", "tear", "noise"],
    preset: IDEA_GLITCH,
    description: "Aggressive melt, scanlines, and fast color cycling.",
    category: "legacy",
  },
  {
    id: "xerox-punk",
    label: "Xerox Punk",
    keywords: ["zine", "punk", "xerox", "photocopy", "raw", "grit"],
    preset: IDEA_XEROX_PUNK,
    description: "Harsh B&W halftone with heavy posterize and grain.",
    category: "legacy",
  },
  {
    id: "cold-scan",
    label: "Cold Scan",
    keywords: ["cold", "clinical", "blue", "sterile", "scan", "medical"],
    preset: IDEA_COLD_SCAN,
    description: "Ice-blue duotone with crisp scanlines and minimal melt.",
    category: "legacy",
  },
  {
    id: "strobe-haze",
    label: "Strobe Haze",
    keywords: ["club", "rave", "strobe", "fast", "neon", "harsh"],
    preset: IDEA_STROBE_HAZE,
    description: "Fast color cycling, heavy bleed, and low posterize.",
    category: "legacy",
  },
  {
    id: "tape-worn",
    label: "Tape Worn",
    keywords: ["vhs", "tape", "retro", "analog", "scanlines", "worn"],
    preset: IDEA_TAPE_WORN,
    description: "Heavy scanlines and analog noise with faded warm grade.",
    category: "legacy",
  },
  {
    id: "raw-zine",
    label: "Raw Zine",
    keywords: ["zine", "diy", "collage", "offset", "rough", "print"],
    preset: IDEA_RAW_ZINE,
    description: "Saturated offset duotone with halftone and unlinked motion.",
    category: "legacy",
  },
];

/** Featured first, then legacy — mood iteration order. */
export const PRESET_CATALOG: PresetCatalogEntry[] = [...FEATURED_PRESETS, ...LEGACY_PRESETS];

export const IDEA_PRESETS = PRESET_CATALOG;

export function getPresetById(id: string): PresetCatalogEntry | undefined {
  return PRESET_CATALOG.find((entry) => entry.id === id);
}
