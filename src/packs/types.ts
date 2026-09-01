/** Pack catalog types (M02 §3; M06 craft). */

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

export type PackFamily = "film" | "editorial" | "poster" | "portrait-split";

export type TextPositionHint = "top-band" | "bottom-left" | "center";
export type TypePresetId = "sans-bold" | "condensed";

/** Pack-suggested type layout (M06 §7); content stays user-authored. */
export type PackTextHints = {
  position: TextPositionHint;
  typePreset: TypePresetId;
};

export type Pack = {
  id: string;
  version: string;
  label: string;
  summary?: string;
  family: PackFamily;
  axes: string[];
  mainEffects: Effect[];
  overlay?: PackOverlayDefaults;
  regionalDefaults?: PackRegionalDefaults;
  textHints?: PackTextHints;
};

export type PackId =
  | "warm-film"
  | "dusk-grain"
  | "flash-raw"
  | "cool-chrome"
  | "editorial-bw"
  | "clean-editorial"
  | "muted-split"
  | "poster-punch";

export const PACK_FAMILIES: readonly PackFamily[] = [
  "film",
  "editorial",
  "poster",
  "portrait-split",
] as const;

export const TEXT_POSITIONS: readonly TextPositionHint[] = [
  "top-band",
  "bottom-left",
  "center",
] as const;

export const TYPE_PRESETS: readonly TypePresetId[] = ["sans-bold", "condensed"] as const;
