import { PRESET_CATALOG, type PresetCatalogEntry } from "@/data/presetCatalog";
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

/** Legacy-only mood terms — win ties against featured partial matches (e.g. neon vs vintage). */
const EXPRESSIVE_KEYWORDS = new Set([
  "acid",
  "neon",
  "glitch",
  "club",
  "rave",
  "strobe",
  "punk",
  "zine",
  "flyer",
  "harsh",
  "digital",
  "decay",
  "tear",
  "xerox",
  "photocopy",
  "rave",
]);

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

function entryMatchesExpressiveKeyword(entry: PresetCatalogEntry, tokens: string[]): boolean {
  return tokens.some((token) =>
    entry.keywords.some(
      (kw) => EXPRESSIVE_KEYWORDS.has(kw) && tokenMatchesKeyword(token, kw),
    ),
  );
}

/** Resolve ties: expressive legacy beats featured; else featured beats legacy; else catalog order. */
function pickWinnerAmongTied(
  tied: PresetCatalogEntry[],
  tokens: string[],
): PresetCatalogEntry {
  const legacyExpressive = tied.filter(
    (entry) => entry.category === "legacy" && entryMatchesExpressiveKeyword(entry, tokens),
  );
  if (legacyExpressive.length > 0) {
    return legacyExpressive[0]!;
  }

  const featured = tied.filter((entry) => entry.category === "featured");
  if (featured.length > 0) {
    return featured[0]!;
  }

  return tied[0]!;
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
  if (/\b(warmer|warmth)\b/.test(normalized)) {
    background.colorB = "#e8a060";
    hasPatch = true;
  }
  if (/\b(darker|deep)\b/.test(normalized)) {
    background.colorA = "#080810";
    hasPatch = true;
  }
  if (/\b(more\s+grain|grainier)\b/.test(normalized)) {
    background.noiseLevel = 0.18;
    background.scanlineIntensity = 0.08;
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

  const scored = PRESET_CATALOG.map((entry) => ({
    entry,
    score: scoreEntry(tokens, entry.keywords),
  }));

  const bestScore = Math.max(...scored.map((s) => s.score), 0);
  const fallback = bestScore < 1;

  let presetId = MOOD_FALLBACK_PRESET_ID;
  if (!fallback) {
    const tied = scored.filter((s) => s.score === bestScore).map((s) => s.entry);
    presetId =
      tied.length === 1 ? tied[0]!.id : pickWinnerAmongTied(tied, tokens).id;
  }

  const confidence = fallback ? 0 : bestScore / tokens.length;
  const patch = buildModifierPatch(normalized);

  return {
    presetId,
    score: confidence,
    ...(patch ? { patch } : {}),
    ...(fallback ? { fallback: true } : {}),
  };
}
