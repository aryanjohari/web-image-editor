/**
 * Connect-style POST /api/talk handler (M03 §3).
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { clientIpFromForwarded, processTalk } from "../api/_lib/talkCore.js";

function clientIp(req: IncomingMessage): string {
  return clientIpFromForwarded(
    req.headers["x-forwarded-for"],
    req.socket.remoteAddress ?? "unknown",
  );
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

  const result = await processTalk(bodyText, { ip });
  if (!result.ok) {
    sendError(res, result.status, result.code, result.message);
    return;
  }

  sendJson(res, 200, result.response);
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
