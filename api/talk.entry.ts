/**
 * Vercel serverless POST /api/talk (I3b) — esbuild entry (bundled → api/talk.js).
 * Reuses api/_lib/talkCore — same contract as dev Vite middleware.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { clientIpFromForwarded, processTalk } from "./_lib/talkCore.js";

type VercelRequest = IncomingMessage & {
  method?: string;
  body?: unknown;
  headers: IncomingMessage["headers"] & Record<string, string | string[] | undefined>;
};

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

async function readRawBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    return req.body;
  }

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

export default async function handler(
  req: VercelRequest,
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

  const ip = clientIpFromForwarded(
    req.headers["x-forwarded-for"],
    req.socket?.remoteAddress ?? "unknown",
  );

  let rawBody: unknown;
  try {
    rawBody = await readRawBody(req);
  } catch (e) {
    sendError(
      res,
      400,
      "HTTP_400",
      e instanceof Error ? e.message : "failed to read body",
    );
    return;
  }

  try {
    const result = await processTalk(rawBody, { ip });
    if (!result.ok) {
      sendError(res, result.status, result.code, result.message);
      return;
    }
    sendJson(res, 200, result.response);
  } catch (e) {
    sendError(
      res,
      500,
      "HTTP_500",
      e instanceof Error ? e.message : "talk handler failed",
    );
  }
}
