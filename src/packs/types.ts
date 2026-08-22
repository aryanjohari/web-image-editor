/** Pack catalog types (M02 §3). */

import type { BlendMode, Effect } from "../recipe/types";

export type PackOverlayDefaults = {
  opacity?: number;
  blend?: BlendMode;
};

export type Pack = {
  id: string;
  version: string;
  label: string;
  summary?: string;
  axes: string[];
  mainEffects: Effect[];
  overlay?: PackOverlayDefaults;
};

export type PackId = "editorial-bw" | "warm-film" | "poster-punch";
