/** Client fetch for POST /api/talk (M03 §7). */

import type { TalkApiError, TalkRequest, TalkResponse } from "./types";
import { TALK_CLIENT_TIMEOUT_MS } from "./types";

export class TalkClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "TalkClientError";
    this.code = code;
  }
}

function httpCode(status: number): string {
  if (status === 400) return "HTTP_400";
  if (status === 401) return "HTTP_401";
  if (status === 429) return "HTTP_429";
  if (status === 500) return "HTTP_500";
  if (status === 502) return "HTTP_502";
  if (status === 503) return "HTTP_503";
  return `HTTP_${status}`;
}

export type PostTalkOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

/**
 * POST /api/talk. Maps network / timeout / HTTP / SCHEMA to TalkClientError.
 * Does not apply recipe — caller normalizes + applyTalk.
 */
export async function postTalk(
  request: TalkRequest,
  options: PostTalkOptions = {},
): Promise<TalkResponse> {
  const timeoutMs = options.timeoutMs ?? TALK_CLIENT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onOuterAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", onOuterAbort, { once: true });
  }

  try {
    let res: Response;
    try {
      res = await fetch("/api/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } catch (e) {
      if (controller.signal.aborted) {
        throw new TalkClientError("TIMEOUT", "talk request timed out");
      }
      throw new TalkClientError(
        "OFFLINE",
        e instanceof Error ? e.message : "network error",
      );
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new TalkClientError(
        "SCHEMA",
        `response was not JSON (status ${res.status})`,
      );
    }

    if (!res.ok) {
      const err = body as TalkApiError;
      const code =
        err?.error?.code && typeof err.error.code === "string"
          ? err.error.code
          : httpCode(res.status);
      const message =
        err?.error?.message && typeof err.error.message === "string"
          ? err.error.message
          : `talk failed (${res.status})`;
      throw new TalkClientError(code, message);
    }

    return body as TalkResponse;
  } finally {
    clearTimeout(timer);
    if (options.signal) {
      options.signal.removeEventListener("abort", onOuterAbort);
    }
  }
}
