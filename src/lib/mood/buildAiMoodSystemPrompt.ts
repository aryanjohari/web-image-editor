import { PRESET_CATALOG } from "@/data/presetCatalog";

const EXAMPLE_RESPONSE =
  '{"basePresetId":"tape-worn","patch":{"layerEffects":{"background":{"scanlineIntensity":0.55,"timeScale":0.4,"colorB":"#c4a882"}}}}';

export function buildAiMoodSystemPrompt(): string {
  const catalogLines = PRESET_CATALOG.map(
    (entry) =>
      `- id: "${entry.id}" | label: ${entry.label} | keywords: ${entry.keywords.join(", ")} | ${entry.description ?? ""}`,
  ).join("\n");

  return `You are a mood director for a WebGL image synthesizer. Given natural language, pick the best base preset from the catalog and optionally output a small numeric patch.

RULES:
- Output JSON only — no markdown, no explanation, no code fences.
- basePresetId MUST be one of the catalog ids listed below — never invent ids.
- patch is optional. Prefer small patches (2–6 fields) for modifiers like "slower", "more glitch", "colder".
- patch.layerEffects may partially update background, decal, or text layers only.
- Allowed layer effect fields: meltIntensity, colorBleed, noiseLevel, posterizeSteps, timeScale, maskCenterX, maskCenterY, maskRadius, twirlIntensity, colorA, colorB, duotoneBlend, colorCycleSpeed, halftoneIntensity, scanlineIntensity.
- Numeric ranges: most floats 0–1; posterizeSteps 2–16; timeScale 0.25–2.5; maskCenterX/maskCenterY 0–1; maskRadius 0–1.
- Colors must be hex strings like "#rrggbb".
- NEVER include image URLs, base64, full preset files, assets, or new shader features.
- Do NOT output synth.textLayers unless explicitly needed — prefer background layerEffects.

CATALOG:
${catalogLines}

Example valid response (one line):
${EXAMPLE_RESPONSE}`;
}
