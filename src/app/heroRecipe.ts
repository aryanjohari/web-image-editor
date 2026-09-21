import { ENGINE_VERSION, SCHEMA_VERSION, type Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";

/** Bundled same-origin textures for hero-lite (M04 X9) and the cover frame. */
export const HERO_RECIPE: Recipe = validateRecipe({
  schemaVersion: SCHEMA_VERSION,
  engineVersion: ENGINE_VERSION,
  packId: "warm-film",
  packVersion: "1.0.0",
  meta: { title: "Prism hero" },
  objects: [
    {
      id: "main",
      kind: "image",
      role: "main",
      z: 0,
      visible: true,
      opacity: 1,
      blend: "normal",
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      effects: [
        { id: "temperature", params: { amount: 0.28 } },
        { id: "fade", params: { amount: 0.18 } },
        { id: "grain", params: { amount: 0.22 } },
        { id: "vignette", params: { amount: 0.35 } },
      ],
      source: { type: "url", url: "/hero/main.png" },
    },
    {
      id: "overlay",
      kind: "image",
      role: "overlay",
      z: 1,
      visible: true,
      opacity: 0.35,
      blend: "screen",
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      effects: [],
      source: { type: "url", url: "/hero/overlay.png" },
    },
    {
      id: "title",
      kind: "text",
      z: 2,
      visible: true,
      opacity: 0.92,
      blend: "normal",
      transform: { x: 0, y: -0.32, scaleX: 1, scaleY: 1, rotation: 0 },
      effects: [],
      text: {
        content: "Prism",
        fontFamily: "IBM Plex Serif, Georgia, serif",
        fontWeight: 500,
        fontSize: 56,
        color: "#f2f0eb",
        align: "center",
      },
    },
  ],
});
