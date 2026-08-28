/**
 * Framework-agnostic talk processing (M03 / I3b).
 * Used by Vite middleware and Vercel serverless route.
 */

import { normalizeTalkResponse } from "../src/talk/normalize";
import type { TalkRequest } from "../src/talk/types";
import type { TalkResponse } from "../src/talk/types";
import {
  getGeminiApiKey,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "./env";
import { generateTalkJson } from "./gemini";

type RateBucket = number[];
const rateByIp = new Map<string, RateBucket>();

export const SERVER_TIMEOUT_MS = 14_000;

export type TalkProcessResult =
  | { ok: true; status: 200; response: TalkResponse }
  | { ok: false; status: number; code: string; message: string };

export function clientIpFromForwarded(
  forwarded: string | string[] | undefined,
  fallback: string,
): string {
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]!.trim();
  }
  return fallback;
}

export function allowRate(ip: string): boolean {
  const now = Date.now();
  const prev = rateByIp.get(ip) ?? [];
  const recent = prev.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateByIp.set(ip, recent);
  return true;
}

function isRecipeContext(v: unknown): v is TalkRequest["recipeContext"] {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const rec = v as Record<string, unknown>;
  if (!("sliders" in rec) || rec.sliders === null || typeof rec.sliders !== "object") {
    return false;
  }
  const s = rec.sliders as Record<string, unknown>;
  const required = [
    "exposure",
    "contrast",
    "warmth",
    "chroma",
    "fade",
    "grain",
    "vignette",
  ] as const;
  for (const k of required) {
    if (typeof s[k] !== "number" || !Number.isFinite(s[k] as number)) return false;
  }
  return true;
}

export function parseTalkRequest(raw: unknown): TalkRequest | string {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return "body must be an object";
  }
  const rec = raw as Record<string, unknown>;
  if (typeof rec.text !== "string" || !rec.text.trim()) {
    return "text must be a non-empty string";
  }
  if (!isRecipeContext(rec.recipeContext)) {
    return "recipeContext.sliders with finite amounts required";
  }
  if ("image" in rec || "imageBase64" in rec || "blob" in rec || "pixels" in rec) {
    return "image bytes not allowed in talk request";
  }
  return {
    text: rec.text.trim().slice(0, 2000),
    recipeContext: rec.recipeContext,
  };
}

function parseRawBody(rawBody: unknown): { ok: true; parsed: unknown } | { ok: false; result: TalkProcessResult } {
  if (typeof rawBody === "string") {
    try {
      return { ok: true, parsed: JSON.parse(rawBody || "{}") };
    } catch {
      return {
        ok: false,
        result: { ok: false, status: 400, code: "SCHEMA", message: "request body was not JSON" },
      };
    }
  }
  return { ok: true, parsed: rawBody };
}

/**
 * Core talk pipeline: rate limit → key → parse → Gemini → normalize.
 */
export async function processTalk(
  rawBody: unknown,
  options: { ip: string },
): Promise<TalkProcessResult> {
  if (!allowRate(options.ip)) {
    return {
      ok: false,
      status: 429,
      code: "RATE_LIMIT",
      message: "too many talk requests; try again shortly",
    };
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: "MISSING_KEY",
      message: "GEMINI_API_KEY not set on server — Lab packs/sliders still work",
    };
  }

  const bodyOrErr = parseRawBody(rawBody);
  if (!bodyOrErr.ok) {
    return bodyOrErr.result;
  }

  const parsed = bodyOrErr.parsed;

  const requestOrErr = parseTalkRequest(parsed);
  if (typeof requestOrErr === "string") {
    return { ok: false, status: 400, code: "HTTP_400", message: requestOrErr };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  try {
    const gemini = await generateTalkJson(apiKey, requestOrErr, {
      signal: controller.signal,
    });
    if (!gemini.ok) {
      const status =
        gemini.code === "TIMEOUT"
          ? 504
          : gemini.code === "HTTP_429"
            ? 429
            : gemini.code === "HTTP_401"
              ? 401
              : 502;
      return { ok: false, status, code: gemini.code, message: gemini.message };
    }

    const normalized = normalizeTalkResponse(gemini.raw, requestOrErr.recipeContext);
    if (!normalized.ok) {
      return { ok: false, status: 422, code: normalized.code, message: normalized.message };
    }

    return { ok: true, status: 200, response: normalized.response };
  } finally {
    clearTimeout(timer);
  }
}
