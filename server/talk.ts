/**
 * Connect-style POST /api/talk handler (M03 §3).
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { normalizeTalkResponse } from "../src/talk/normalize";
import type { RecipeContext, TalkRequest } from "../src/talk/types";
import {
  getGeminiApiKey,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "./env";
import { generateTalkJson } from "./gemini";

type RateBucket = number[];
const rateByIp = new Map<string, RateBucket>();

function clientIp(req: IncomingMessage): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

function allowRate(ip: string): boolean {
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

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  sendJson(res, status, { error: { code, message } });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 64_000) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isRecipeContext(v: unknown): v is RecipeContext {
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

function parseTalkRequest(raw: unknown): TalkRequest | string {
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

const SERVER_TIMEOUT_MS = 14_000;

export async function handleTalkRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "HTTP_400", "POST only");
    return;
  }

  const ip = clientIp(req);
  if (!allowRate(ip)) {
    sendError(res, 429, "RATE_LIMIT", "too many talk requests; try again shortly");
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    sendError(
      res,
      503,
      "MISSING_KEY",
      "GEMINI_API_KEY not set on server — Lab packs/sliders still work",
    );
    return;
  }

  let bodyText: string;
  try {
    bodyText = await readBody(req);
  } catch (e) {
    sendError(
      res,
      400,
      "HTTP_400",
      e instanceof Error ? e.message : "failed to read body",
    );
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText || "{}");
  } catch {
    sendError(res, 400, "SCHEMA", "request body was not JSON");
    return;
  }

  const requestOrErr = parseTalkRequest(parsed);
  if (typeof requestOrErr === "string") {
    sendError(res, 400, "HTTP_400", requestOrErr);
    return;
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
      sendError(res, status, gemini.code, gemini.message);
      return;
    }

    const normalized = normalizeTalkResponse(
      gemini.raw,
      requestOrErr.recipeContext,
    );
    if (!normalized.ok) {
      sendError(res, 422, normalized.code, normalized.message);
      return;
    }

    sendJson(res, 200, normalized.response);
  } finally {
    clearTimeout(timer);
  }
}

/** Connect middleware: mount at /api/talk. */
export function talkMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  const url = req.url ?? "";
  const path = url.split("?")[0];
  if (path !== "/api/talk" && path !== "/api/talk/") {
    next();
    return;
  }
  void handleTalkRequest(req, res).catch((e) => {
    sendError(
      res,
      500,
      "HTTP_500",
      e instanceof Error ? e.message : "talk handler failed",
    );
  });
}
