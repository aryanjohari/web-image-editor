/**
 * Gemini structured-output JSON Schema for TalkResponse (M03 §4).
 * Enums lock pack + slider ids; no free PathPatch strings.
 */

import { TALK_PACK_IDS, TALK_SLIDER_IDS } from "./types";

/** Schema object compatible with @google/genai `responseSchema`. */
export const TALK_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    applyPack: {
      type: "OBJECT",
      properties: {
        packId: {
          type: "STRING",
          enum: [...TALK_PACK_IDS],
          description: "Catalog pack id only",
        },
        intensity: {
          type: "NUMBER",
          description: "Optional pack intensity 0..1; default 1",
        },
      },
      required: ["packId"],
    },
    patches: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          op: {
            type: "STRING",
            enum: ["set_slider", "delta_slider"],
          },
          sliderId: {
            type: "STRING",
            enum: [...TALK_SLIDER_IDS],
          },
          value: {
            type: "NUMBER",
            description: "Absolute value for set_slider",
          },
          delta: {
            type: "NUMBER",
            description:
              "Relative delta for delta_slider; omit size only if unsure — host fills ~0.1 span",
          },
        },
        required: ["op", "sliderId"],
      },
    },
    say: {
      type: "STRING",
      description: "Optional ≤1 short line for UI toast; never recipe truth",
    },
    refuse: {
      type: "OBJECT",
      properties: {
        code: { type: "STRING" },
        reason: { type: "STRING" },
      },
      required: ["code", "reason"],
      description:
        "Use for generative/inpaint/beach/remove-person or out-of-scope intents",
    },
  },
} as const;

export const TALK_SYSTEM_PROMPT = `You are Prism's parametric talk router — NOT a generative image editor.

Map the user's short mood/refinement sentence to structured JSON only:
- applyPack: one of editorial-bw | warm-film | poster-punch (optional intensity 0..1)
- patches: set_slider (absolute) or delta_slider (relative). Prefer delta_slider for "less/more/warmer/cooler".
- Slider ids: exposure, contrast, warmth, chroma, fade, grain, vignette, duotone
- say: optional one short line for UI; never the look truth
- refuse: for generative/inpaint/outpaint/"put me on a beach"/remove person/beauty retouch/open-world invent

Rules:
1. You NEVER invent free shader paths, new effect ids, or mood JSON that bypasses packs/sliders.
2. Refinement needs recipeContext sliders — apply relative deltas with correct sign ("less grain" → negative grain delta).
3. You MAY combine applyPack then patches in one turn.
4. If intent is generative or outside the closed pack/slider language → set refuse (no applyPack/patches).
5. Text-only router; ignore any request to analyze or upload image bytes.`;
