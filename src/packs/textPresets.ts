import type { TypePresetId } from "./types";

export type TypePresetStyle = {
  fontFamily: string;
  fontWeight: number | string;
  fontSize: number;
  letterSpacing?: number;
  align: "left" | "center" | "right";
};

/** Closed type presets for pack textHints (M06 §7). */
export function typePresetStyle(preset: TypePresetId): TypePresetStyle {
  switch (preset) {
    case "condensed":
      return {
        fontFamily: "Arial Narrow, Impact, Haettenschweiler, sans-serif",
        fontWeight: 700,
        fontSize: 56,
        letterSpacing: 1.5,
        align: "left",
      };
    case "sans-bold":
    default:
      return {
        fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif",
        fontWeight: 700,
        fontSize: 52,
        letterSpacing: 0.5,
        align: "left",
      };
  }
}
