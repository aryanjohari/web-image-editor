import { afterEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return { generateContent };
      }
    },
  };
});

import { runStageBrief } from "@/lib/stage/runStageBrief";

afterEach(() => {
  generateContent.mockReset();
});

describe("runStageBrief", () => {
  it("returns 400 when brief empty", async () => {
    const result = await runStageBrief({ brief: "  ", apiKey: "k" });
    expect(result).toEqual({ ok: false, status: 400, error: "brief is required" });
  });

  it("parses valid Gemini JSON", async () => {
    generateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            baseLookId: "soft-drift",
            summary: "ok",
            patch: { layerEffects: { background: { timeScale: 0.6 } } },
          }),
      },
    });

    const result = await runStageBrief({
      brief: "calm navy",
      apiKey: "test-key",
      brand: {
        id: "b",
        name: "Test",
        colors: [{ id: "c1", hex: "#001122" }],
        fonts: [],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.baseLookId).toBe("soft-drift");
      expect(result.data.patch.layerEffects?.background?.timeScale).toBe(0.6);
    }
    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("returns 422 on invalid model JSON", async () => {
    generateContent.mockResolvedValue({
      response: { text: () => "not-json{{{" },
    });
    const result = await runStageBrief({ brief: "x", apiKey: "k" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(422);
    }
  });

  it("returns 502 on SDK throw", async () => {
    generateContent.mockRejectedValue(new Error("network down"));
    const result = await runStageBrief({ brief: "x", apiKey: "k" });
    expect(result).toEqual({ ok: false, status: 502, error: "network down" });
  });
});
