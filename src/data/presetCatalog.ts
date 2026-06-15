import type { SynthPresetV2 } from "@/lib/preset/types";
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
} from "@/data/demoIdeasPresets";

export type PresetCatalogEntry = {
  id: string;
  label: string;
  keywords: string[];
  preset: SynthPresetV2;
  description?: string;
};

export const PRESET_CATALOG: PresetCatalogEntry[] = [
  // Noir / acid
  {
    id: "acid-noir",
    label: "Acid Noir",
    keywords: ["acid", "neon", "noir", "flyer", "contrast", "duotone"],
    preset: IDEA_ACID_NOIR,
    description: "High-contrast neon duotone bleed with linked motion.",
  },
  // Digital decay
  {
    id: "glitch-core",
    label: "Glitch Core",
    keywords: ["glitch", "digital", "decay", "scanlines", "tear", "noise"],
    preset: IDEA_GLITCH,
    description: "Aggressive melt, scanlines, and fast color cycling.",
  },
  // Archival / warm
  {
    id: "archive",
    label: "Archive",
    keywords: ["archival", "warm", "halftone", "print", "offset", "calm"],
    preset: IDEA_ARCHIVE,
    description: "Slow halftone posterization with warm paper tones.",
  },
  // Soft / dreamy
  {
    id: "soft-bloom",
    label: "Soft Bloom",
    keywords: ["soft", "dreamy", "bloom", "pastel", "gentle", "haze"],
    preset: IDEA_SOFT_BLOOM,
    description: "Lavender/pink duotone with very slow, soft bleed.",
  },
  // Zine / punk
  {
    id: "xerox-punk",
    label: "Xerox Punk",
    keywords: ["zine", "punk", "xerox", "photocopy", "raw", "grit"],
    preset: IDEA_XEROX_PUNK,
    description: "Harsh B&W halftone with heavy posterize and grain.",
  },
  // Cold / clinical
  {
    id: "cold-scan",
    label: "Cold Scan",
    keywords: ["cold", "clinical", "blue", "sterile", "scan", "medical"],
    preset: IDEA_COLD_SCAN,
    description: "Ice-blue duotone with crisp scanlines and minimal melt.",
  },
  // Sunset / warm slow
  {
    id: "sunset-melt",
    label: "Sunset Melt",
    keywords: ["sunset", "warm", "golden", "slow", "glow", "melt"],
    preset: IDEA_SUNSET_MELT,
    description: "Deep orange/magenta duotone with slow, heavy melt.",
  },
  // Club / harsh / fast
  {
    id: "strobe-haze",
    label: "Strobe Haze",
    keywords: ["club", "rave", "strobe", "fast", "neon", "harsh"],
    preset: IDEA_STROBE_HAZE,
    description: "Fast color cycling, heavy bleed, and low posterize.",
  },
  // VHS / tape
  {
    id: "tape-worn",
    label: "Tape Worn",
    keywords: ["vhs", "tape", "retro", "analog", "scanlines", "worn"],
    preset: IDEA_TAPE_WORN,
    description: "Heavy scanlines and analog noise with faded warm grade.",
  },
  // Zine / DIY
  {
    id: "raw-zine",
    label: "Raw Zine",
    keywords: ["zine", "diy", "collage", "offset", "rough", "print"],
    preset: IDEA_RAW_ZINE,
    description: "Saturated offset duotone with halftone and unlinked motion.",
  },
];

export const IDEA_PRESETS = PRESET_CATALOG;

export function getPresetById(id: string): PresetCatalogEntry | undefined {
  return PRESET_CATALOG.find((entry) => entry.id === id);
}
