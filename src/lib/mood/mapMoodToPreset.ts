import { PRESET_CATALOG } from "@/data/presetCatalog";
import type { PresetPatch } from "@/lib/preset/apply";

export const MOOD_FALLBACK_PRESET_ID = "archive";

export type MoodMapResult = {
  /** Winning catalog entry id */
  presetId: string;
  /** 0–1 confidence; optional for UI */
  score: number;
  /** Optional numeric nudge after base style apply */
  patch?: PresetPatch;
  /** Human hint when fallback used */
  fallback?: boolean;
};

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

function tokenize(normalized: string): string[] {
  return normalized.split(/[^a-z0-9]+/).filter(Boolean);
}

/** Bidirectional substring match: glitch ↔ glitchy, archival ↔ archive */
function tokenMatchesKeyword(token: string, keyword: string): boolean {
  return token.includes(keyword) || keyword.includes(token);
}

function scoreEntry(tokens: string[], keywords: string[]): number {
  let score = 0;
  for (const token of tokens) {
    if (keywords.some((kw) => tokenMatchesKeyword(token, kw))) {
      score += 1;
    }
  }
  return score;
}

function buildModifierPatch(normalized: string): PresetPatch | undefined {
  const background: NonNullable<PresetPatch["layerEffects"]>["background"] = {};
  let hasPatch = false;

  if (/\b(slower|slow|dreamy)\b/.test(normalized)) {
    background.timeScale = 0.35;
    hasPatch = true;
  }
  if (/\b(faster|fast|harsh)\b/.test(normalized)) {
    background.timeScale = 2.2;
    hasPatch = true;
  }
  if (/\b(more\s+glitch|glitchier)\b/.test(normalized)) {
    background.meltIntensity = 0.82;
    background.scanlineIntensity = 0.52;
    hasPatch = true;
  }
  if (/\b(less|subtle|calm)\b/.test(normalized)) {
    background.meltIntensity = 0.06;
    background.colorBleed = 0.22;
    hasPatch = true;
  }
  if (/\b(colder|cold)\b/.test(normalized)) {
    background.colorB = "#4a9eff";
    hasPatch = true;
  }

  if (!hasPatch) return undefined;
  return { layerEffects: { background } };
}

export function mapMoodToPreset(input: string): MoodMapResult {
  const normalized = normalize(input);
  const tokens = tokenize(normalized);

  if (tokens.length === 0) {
    return { presetId: MOOD_FALLBACK_PRESET_ID, score: 0, fallback: true };
  }

  let bestId = MOOD_FALLBACK_PRESET_ID;
  let bestScore = 0;

  for (const entry of PRESET_CATALOG) {
    const score = scoreEntry(tokens, entry.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestId = entry.id;
    }
  }

  const fallback = bestScore < 1;
  const presetId = fallback ? MOOD_FALLBACK_PRESET_ID : bestId;
  const confidence = fallback ? 0 : bestScore / tokens.length;
  const patch = buildModifierPatch(normalized);

  return {
    presetId,
    score: confidence,
    ...(patch ? { patch } : {}),
    ...(fallback ? { fallback: true } : {}),
  };
}
