/**
 * Gemini structured-output JSON Schema for TalkResponse (M03 §4; M05 regional; M06; M07).
 * Enums lock pack + slider ids; no free PathPatch strings.
 */

import {
  TALK_PACK_IDS,
  TALK_REGIONAL_PRESET_IDS,
  TALK_REGIONAL_REGIONS,
  TALK_REGIONAL_SLIDER_IDS,
  TALK_SLIDER_IDS,
  TALK_TEXT_POSITIONS,
  TALK_TRANSFORM_TARGETS,
  TALK_TYPE_PRESETS,
} from "./types";

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
            enum: [
              "set_slider",
              "delta_slider",
              "set_regional_slider",
              "delta_regional_slider",
            ],
          },
          sliderId: {
            type: "STRING",
            enum: [...TALK_SLIDER_IDS, ...TALK_REGIONAL_SLIDER_IDS],
            description: "Global semantic slider or regional slider id",
          },
          region: {
            type: "STRING",
            enum: [...TALK_REGIONAL_REGIONS],
            description: "Required for regional slider ops",
          },
          value: {
            type: "NUMBER",
            description: "Absolute value for set_slider / set_regional_slider",
          },
          delta: {
            type: "NUMBER",
            description:
              "Relative delta for delta_slider / delta_regional_slider; omit size only if unsure — host fills ~0.1 span",
          },
        },
        required: ["op"],
      },
    },
    applyRegionalPreset: {
      type: "OBJECT",
      properties: {
        presetId: {
          type: "STRING",
          enum: [...TALK_REGIONAL_PRESET_IDS],
          description: "Closed regional template; requires hasMask in context",
        },
      },
      required: ["presetId"],
    },
    setTextHint: {
      type: "OBJECT",
      properties: {
        position: {
          type: "STRING",
          enum: [...TALK_TEXT_POSITIONS],
        },
        typePreset: {
          type: "STRING",
          enum: [...TALK_TYPE_PRESETS],
        },
      },
      description: "Optional text layout hint (3 positions, 2 presets)",
    },
    setTextContent: {
      type: "OBJECT",
      properties: {
        content: {
          type: "STRING",
          description: "Exact title/caption string to set on the single text object",
        },
      },
      required: ["content"],
      description: "Set or create the single text object's content (not copywriting Autofill)",
    },
    nudgeTransform: {
      type: "OBJECT",
      properties: {
        target: {
          type: "STRING",
          enum: [...TALK_TRANSFORM_TARGETS],
        },
        dx: {
          type: "NUMBER",
          description: "NDC x delta; omit for default ~0.08 when intent implies horizontal move",
        },
        dy: {
          type: "NUMBER",
          description: "NDC y delta (+up); omit for default ~0.08 when intent implies vertical move",
        },
        dScale: {
          type: "NUMBER",
          description: "Uniform scale delta; omit for default ~0.1 when intent implies bigger/smaller",
        },
      },
      required: ["target"],
      description: "Relative move/scale for text or overlay (prefer for 'up a bit')",
    },
    setTransform: {
      type: "OBJECT",
      properties: {
        target: {
          type: "STRING",
          enum: [...TALK_TRANSFORM_TARGETS],
        },
        x: { type: "NUMBER" },
        y: { type: "NUMBER" },
        scaleX: { type: "NUMBER" },
        scaleY: { type: "NUMBER" },
      },
      required: ["target"],
      description: "Absolute transform fields for text or overlay (e.g. center)",
    },
    regenerateMask: {
      type: "BOOLEAN",
      description:
        "When true, host re-runs client mask worker (local only; no image bytes sent)",
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
- applyPack: one of warm-film | dusk-grain | flash-raw | cool-chrome | editorial-bw | clean-editorial | muted-split | poster-punch (optional intensity 0..1)
- patches: set_slider (absolute) or delta_slider (relative). Prefer delta_slider for "less/more/warmer/cooler".
- Slider ids: exposure, contrast, warmth, chroma, fade, grain, grain_size, vignette, blur, duotone
- When recipeContext.hasMask is true, prefer regional tools for subject/background language:
  - set_regional_slider / delta_regional_slider with region subject|background and sliderId bg_mute | bg_fade | bg_blur | subject_pop | subject_chroma
  - applyRegionalPreset: muted_background (desaturated faded bg) or subject_pop (more contrast/color on subject)
  - regenerateMask: true when user asks to redo/fix the person mask (client worker only)
- setTextHint: optional { position: top-band|bottom-left|center, typePreset: sans-bold|condensed } for poster type snaps
- setTextContent: { content } to set/create the single title string (e.g. "set title to Prism")
- nudgeTransform: { target: text|overlay, dx?, dy?, dScale? } for "move title up / left / bigger" — NDC +y is up; prefer over inventing free pointers
- setTransform: { target, x?, y?, scaleX?, scaleY? } for absolute placement (e.g. center)
- Use recipeContext.selection, textTransform, overlayTransform, hasText, hasOverlay for spatial language
- say: optional one short line for UI; never the look truth
- refuse: for generative/inpaint/outpaint/"put me on a beach"/remove person/beauty retouch/open-world invent/extra layers

Rules:
1. You NEVER invent free shader paths, new effect ids, PathPatch strings, or mood JSON that bypasses packs/sliders.
2. Refinement needs recipeContext sliders — apply relative deltas with correct sign ("less grain" → negative grain delta).
3. When hasMask, "mute the background" → delta_regional_slider bg_mute negative OR applyRegionalPreset muted_background; "make me pop" → subject_pop positive OR preset subject_pop; soft bg → bg_blur.
4. Regional tools require hasMask; if absent, use global sliders only.
5. Prefer MULTI-TOOL turns when the user stacks intents (e.g. warm film + mute bg + title bottom + move title up). You MAY combine applyPack, patches, applyRegionalPreset, setTextHint, setTextContent, nudgeTransform/setTransform, and regenerateMask in one turn (regenerateMask at most once).
6. Text content edits ONLY via setTextContent. Spatial moves ONLY via nudgeTransform/setTransform or setTextHint snaps — never invent overlay pixels or a second text object.
7. If intent is generative, beach, invent layers, or outside closed controls → set refuse (no writes).
8. Text-only router; ignore any request to analyze or upload image bytes.`;
