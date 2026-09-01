/**
 * Gemini structured JSON call (@google/genai).
 * Text-only; no image bytes in contents.
 */

import { GoogleGenAI } from "@google/genai";
import { TALK_RESPONSE_SCHEMA, TALK_SYSTEM_PROMPT } from "../../src/talk/schema";
import type { TalkRequest } from "../../src/talk/types";
import { GEMINI_MODEL_ID } from "./env";

export type GeminiTalkResult =
  | { ok: true; raw: unknown }
  | { ok: false; code: string; message: string };

export async function generateTalkJson(
  apiKey: string,
  request: TalkRequest,
  options: { signal?: AbortSignal; model?: string } = {},
): Promise<GeminiTalkResult> {
  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? GEMINI_MODEL_ID;

  const userPayload = [
    "User request and current recipe context (JSON):",
    JSON.stringify(
      {
        text: request.text,
        recipeContext: request.recipeContext,
      },
      null,
      2,
    ),
  ].join("\n");

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userPayload,
      config: {
        systemInstruction: TALK_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: TALK_RESPONSE_SCHEMA,
        abortSignal: options.signal,
      },
    });

    const text = response.text;
    if (!text || !text.trim()) {
      return { ok: false, code: "SCHEMA", message: "empty model response" };
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return { ok: false, code: "SCHEMA", message: "model response was not JSON" };
    }
    return { ok: true, raw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (
      lower.includes("abort") ||
      lower.includes("timeout") ||
      lower.includes("timed out")
    ) {
      return { ok: false, code: "TIMEOUT", message: msg };
    }
    if (lower.includes("429") || lower.includes("resource_exhausted")) {
      return { ok: false, code: "HTTP_429", message: msg };
    }
    if (lower.includes("401") || lower.includes("403") || lower.includes("api key")) {
      return { ok: false, code: "HTTP_401", message: msg };
    }
    return { ok: false, code: "HTTP_502", message: msg };
  }
}
