import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Gemini SDK is the network boundary; everything else in the talk pipeline runs for real.
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { RATE_LIMIT_MAX } from "./env";
import { processTalk, SERVER_TIMEOUT_MS } from "./talkCore";

const validBody = () => ({
  text: "less grain",
  recipeContext: {
    sliders: {
      exposure: 0,
      contrast: 0.15,
      warmth: 0.35,
      chroma: -0.1,
      fade: 0.22,
      grain: 0.35,
      vignette: 0.4,
    },
  },
});

// The rate limiter is module-level state, so every test gets its own client IP.
let ipCounter = 0;
const freshIp = () => `10.0.0.${++ipCounter}`;

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  generateContent.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("processTalk", () => {
  it("returns the normalized patch when Gemini answers with valid JSON", async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        patches: [{ op: "set_slider", sliderId: "grain", value: 0.2 }],
      }),
    });

    const result = await processTalk(validBody(), { ip: freshIp() });

    expect(result).toMatchObject({ ok: true, status: 200 });
    if (!result.ok) return;
    expect(result.response.patches?.[0]).toMatchObject({
      op: "set_slider",
      sliderId: "grain",
    });
  });

  it("answers 503 MISSING_KEY without calling Gemini when the key is unset", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await processTalk(validBody(), { ip: freshIp() });

    expect(result).toMatchObject({ ok: false, status: 503, code: "MISSING_KEY" });
    expect(generateContent).not.toHaveBeenCalled();
  });

  describe("input validation", () => {
    const withoutSliders = { text: "hi", recipeContext: {} };
    const cases: [string, unknown, number, string][] = [
      ["non-object body", [], 400, "HTTP_400"],
      ["empty text", { ...validBody(), text: "   " }, 400, "HTTP_400"],
      ["missing recipe sliders", withoutSliders, 400, "HTTP_400"],
      ["image bytes in the request", { ...validBody(), imageBase64: "AAAA" }, 400, "HTTP_400"],
      ["body that is not JSON", "{not json", 400, "SCHEMA"],
    ];

    it.each(cases)("rejects %s", async (_name, body, status, code) => {
      const result = await processTalk(body, { ip: freshIp() });

      expect(result).toMatchObject({ ok: false, status, code });
      expect(generateContent).not.toHaveBeenCalled();
    });
  });

  it("answers 429 RATE_LIMIT once an IP exceeds the per-window limit", async () => {
    const ip = freshIp();
    // A bad body is rejected cheaply (400) after the rate check, so no Gemini call is needed.
    const badBody: unknown = [];

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const allowed = await processTalk(badBody, { ip });
      expect(allowed).toMatchObject({ status: 400 });
    }
    const limited = await processTalk(badBody, { ip });

    expect(limited).toMatchObject({ ok: false, status: 429, code: "RATE_LIMIT" });
  });

  it("answers 504 TIMEOUT when Gemini does not answer within the server timeout", async () => {
    vi.useFakeTimers();
    generateContent.mockImplementation(
      ({ config }: { config: { abortSignal: AbortSignal } }) =>
        new Promise((_resolve, reject) => {
          config.abortSignal.addEventListener("abort", () =>
            reject(new Error("The operation was aborted")),
          );
        }),
    );

    const pending = processTalk(validBody(), { ip: freshIp() });
    await vi.advanceTimersByTimeAsync(SERVER_TIMEOUT_MS);

    expect(await pending).toMatchObject({ ok: false, status: 504, code: "TIMEOUT" });
  });

  describe("upstream failures", () => {
    const cases: [string, string, number, string][] = [
      ["quota exhausted", "429 RESOURCE_EXHAUSTED", 429, "HTTP_429"],
      ["bad API key", "403 API key not valid", 401, "HTTP_401"],
      ["anything else", "connection reset", 502, "HTTP_502"],
    ];

    it.each(cases)("maps %s to the matching status", async (_name, message, status, code) => {
      generateContent.mockRejectedValue(new Error(message));

      const result = await processTalk(validBody(), { ip: freshIp() });

      expect(result).toMatchObject({ ok: false, status, code });
    });

    it("answers 502 SCHEMA when the model reply is not JSON", async () => {
      generateContent.mockResolvedValue({ text: "sure, here you go" });

      const result = await processTalk(validBody(), { ip: freshIp() });

      expect(result).toMatchObject({ ok: false, status: 502, code: "SCHEMA" });
    });
  });
});
