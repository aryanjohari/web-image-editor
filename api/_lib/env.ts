/** Server env for talk route — never VITE_ / client. */

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}

/** Pinned at I3 implement time against Google model cards (2026-08-23). */
export const GEMINI_MODEL_ID = "gemini-2.5-flash";

/** Soft rate limit sketch (in-memory). */
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 20;
