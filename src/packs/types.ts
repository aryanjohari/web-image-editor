/** Pack catalog types (M02 §3). */

import type { BlendMode, Effect } from "../recipe/types";

export type PackOverlayDefaults = {
  opacity?: number;
  blend?: BlendMode;
};

/** Optional per-region effect seeds when main.maskRef is active (M05 §6). */
export type PackRegionalDefaults = {
  subject?: Effect[];
  background?: Effect[];
};

export type Pack = {
  id: string;
  version: string;
  label: string;
  summary?: string;
  axes: string[];
  mainEffects: Effect[];
  overlay?: PackOverlayDefaults;
  regionalDefaults?: PackRegionalDefaults;
};

export type PackId = "editorial-bw" | "warm-film" | "poster-punch";
