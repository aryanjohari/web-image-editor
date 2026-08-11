/**
 * Phase 2 — Gemini system prompt for brief → StageRecipe / PresetPatch.
 */

import type { StageBrandKit } from "./types";

export type BriefPromptCatalogEntry = {
  id: string;
  label: string;
  category: string;
  keywords: string[];
  description?: string;
};

export type BuildBriefSystemPromptInput = {
  catalog: BriefPromptCatalogEntry[];
  brand?: StageBrandKit | null;
  /** When set, further restrict looks (intersection with brand.limits.allowedLookIds). */
  catalogLookIds?: string[];
};

function formatCatalog(entries: BriefPromptCatalogEntry[]): string {
  return entries
    .map(
      (e) =>
        `- id: "${e.id}" | label: ${e.label} | category: ${e.category} | keywords: ${e.keywords.join(", ")} | ${e.description ?? ""}`,
    )
    .join("\n");
}

function resolveAllowedLookIds(
  catalog: BriefPromptCatalogEntry[],
  brand?: StageBrandKit | null,
  catalogLookIds?: string[],
): string[] {
  let ids = catalog.map((e) => e.id);
  if (catalogLookIds && catalogLookIds.length > 0) {
    const allow = new Set(catalogLookIds);
    ids = ids.filter((id) => allow.has(id));
  }
  const brandLooks = brand?.limits?.allowedLookIds;
  if (brandLooks && brandLooks.length > 0) {
    const allow = new Set(brandLooks);
    ids = ids.filter((id) => allow.has(id));
  }
  return ids;
}

function formatBrandConstitution(brand: StageBrandKit | null | undefined, allowedLookIds: string[]): string {
  if (!brand) {
    return `BRAND: none saved. Use featured/ambient looks unless the brief asks for glitch/neon/punk. Prefer conservative effect strengths.`;
  }

  const colors =
    brand.colors.length > 0
      ? brand.colors.map((c) => `${c.id}:${c.hex}${c.role ? `(${c.role})` : ""}`).join(", ")
      : "(none — pick tasteful hex)";
  const fonts =
    brand.fonts.length > 0
      ? brand.fonts.map((f) => `${f.id}:${f.family}${f.role ? `(${f.role})` : ""}`).join(", ")
      : "(none)";
  const limits = brand.limits;
  const capLines: string[] = [];
  if (limits?.maxMeltIntensity !== undefined) {
    capLines.push(`- maxMeltIntensity: ${limits.maxMeltIntensity}`);
  }
  if (limits?.maxNoiseLevel !== undefined) {
    capLines.push(`- maxNoiseLevel: ${limits.maxNoiseLevel}`);
  }
  if (limits?.maxScanlineIntensity !== undefined) {
    capLines.push(`- maxScanlineIntensity: ${limits.maxScanlineIntensity}`);
  }
  if (limits?.requireReducedMotionTwin) {
    capLines.push("- prefer lower timeScale / motion for reduced-motion-friendly twin");
  }

  return `BRAND CONSTITUTION (must respect):
- name: ${brand.name || "(unnamed)"}
- voiceNotes: ${brand.voiceNotes?.trim() || "(none)"}
- colors (prefer these hex values for colorA/colorB and text): ${colors}
- fonts (CSS family hints for copy tone only — do not invent assets): ${fonts}
- allowedLookIds (baseLookId MUST be one of these): ${allowedLookIds.join(", ") || "(full catalog below)"}
${capLines.length ? `- numeric caps:\n${capLines.join("\n")}` : "- numeric caps: none beyond global ranges"}`;
}

const EXAMPLE =
  '{"baseLookId":"soft-drift","summary":"Calm blue drift with brand primary","patch":{"layerEffects":{"background":{"colorA":"#0a0b0c","colorB":"#4a6fa5","timeScale":0.5,"scanlineIntensity":0.1}},"synth":{"textLayers":[{"id":"t1","text":"Launch","color":"#ffffff","fontSize":0.12,"offsetX":0,"offsetY":0.1,"scale":1,"effectsLinked":true}]}}}';

/**
 * Build the constrained LLM system prompt for Stage brief → JSON patch.
 */
export function buildBriefSystemPrompt(input: BuildBriefSystemPromptInput): string {
  const allowedIds = resolveAllowedLookIds(input.catalog, input.brand, input.catalogLookIds);
  const catalogEntries =
    allowedIds.length > 0 && allowedIds.length < input.catalog.length
      ? input.catalog.filter((e) => allowedIds.includes(e.id))
      : input.catalog;

  const brandBlock = formatBrandConstitution(input.brand, allowedIds);

  return `You are the Stage state operator for a WebGL brand background compositor. Given a creative brief, emit a JSON patch only — never images or full recipes with asset bytes.

RULES:
- Output JSON only — no markdown, no explanation, no code fences.
- Top-level keys allowed: baseLookId (optional catalog look id), patch (optional object), summary (optional short string).
- baseLookId MUST be one of the catalog ids listed (or brand allowedLookIds when set) — never invent ids.
- Prefer patch + optional baseLookId. Small patches (2–8 fields) for conversational turns.
- patch.layerEffects may partially update background, decal, or text only.
- Allowed layer effect fields: meltIntensity, colorBleed, noiseLevel, posterizeSteps, timeScale, maskCenterX, maskCenterY, maskRadius, twirlIntensity, colorA, colorB, duotoneBlend, colorCycleSpeed, halftoneIntensity, scanlineIntensity.
- Numeric ranges: most floats 0–1; posterizeSteps 2–16; timeScale 0.25–2.5; mask centers/radius 0–1.
- Colors must be hex "#rrggbb" and should stay within brand colors when provided.
- patch.synth may include: decalScale, decalOffsetX, decalOffsetY, decalBackgroundLumaMask, linkDecalToMath, linkTextToMath, textLayers, selectedTextLayerId, textLayerEffects.
- You MAY change text layer copy and colors within brand.
- NEVER invent new asset image bytes, URLs, base64, full preset files, or new shader features.
- Do NOT include assets, recipeSchemaVersion, engineVersion, or viewport.

${brandBlock}

CATALOG:
${formatCatalog(catalogEntries)}

Example valid response (one line):
${EXAMPLE}`;
}
