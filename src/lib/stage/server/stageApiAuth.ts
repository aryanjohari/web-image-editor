/**
 * Stage API key gate for `/api/v1/*` (except health).
 *
 * Accepts STAGE_API_KEY and/or comma-separated STAGE_API_KEYS.
 * Headers: Authorization: Bearer <key> or X-Stage-Key: <key>.
 */

type EnvMap = Record<string, string | undefined>;

function readProcessEnv(): EnvMap {
  const g = globalThis as { process?: { env?: EnvMap } };
  return g.process?.env ?? {};
}

/** Allowed keys from env (trimmed, non-empty). */
export function getStageApiKeysFromEnv(env: EnvMap = readProcessEnv()): string[] {
  const keys = new Set<string>();
  const single = env.STAGE_API_KEY?.trim();
  if (single) keys.add(single);
  const multi = env.STAGE_API_KEYS?.split(",") ?? [];
  for (const part of multi) {
    const k = part.trim();
    if (k) keys.add(k);
  }
  return Array.from(keys);
}

export type RequestHeaders = {
  authorization?: string | string[] | null;
  "x-stage-key"?: string | string[] | null;
  /** Vercel / Node may lowercase header names */
  [key: string]: string | string[] | undefined | null;
};

function headerValue(headers: RequestHeaders, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [key, raw] of Object.entries(headers)) {
    if (key.toLowerCase() !== lower) continue;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  }
  return undefined;
}

/** Extract presented key from Authorization Bearer or X-Stage-Key. */
export function extractStageApiKey(headers: RequestHeaders): string | undefined {
  const xKey = headerValue(headers, "x-stage-key")?.trim();
  if (xKey) return xKey;

  const auth = headerValue(headers, "authorization")?.trim();
  if (!auth) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) return undefined;
  return match[1].trim() || undefined;
}

export type StageApiAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Validate request headers against configured API keys.
 * 503 when no keys are configured (misconfiguration) so dogfood fails closed-ish.
 */
export function requireStageApiKey(
  headers: RequestHeaders,
  env: EnvMap = readProcessEnv(),
): StageApiAuthResult {
  const allowed = getStageApiKeysFromEnv(env);
  if (allowed.length === 0) {
    return {
      ok: false,
      status: 503,
      error: "Stage API keys are not configured (set STAGE_API_KEY or STAGE_API_KEYS)",
    };
  }

  const presented = extractStageApiKey(headers);
  if (!presented || !allowed.includes(presented)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
