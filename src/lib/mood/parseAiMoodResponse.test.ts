import { describe, expect, it } from "vitest";
import { PRESET_CATALOG } from "@/data/presetCatalog";
import { parseAiMoodResponse } from "@/lib/mood/parseAiMoodResponse";

describe("parseAiMoodResponse", () => {
  it("parses valid minimal JSON", () => {
    const result = parseAiMoodResponse('{"basePresetId":"cold-scan"}');
    expect(result).toEqual({
      ok: true,
      data: { basePresetId: "cold-scan" },
    });
  });

  it("parses valid JSON with patch", () => {
    const raw = JSON.stringify({
      basePresetId: "glitch-core",
      patch: {
        layerEffects: {
          background: { meltIntensity: 0.7, timeScale: 0.4 },
        },
      },
    });
    const result = parseAiMoodResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.basePresetId).toBe("glitch-core");
      expect(result.data.patch?.layerEffects?.background?.meltIntensity).toBe(0.7);
    }
  });

  it("rejects invalid JSON", () => {
    const result = parseAiMoodResponse("{not json");
    expect(result).toEqual({ ok: false, error: "Invalid JSON" });
  });

  it("rejects unknown preset id", () => {
    const result = parseAiMoodResponse('{"basePresetId":"nonexistent-preset"}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Unknown preset id");
    }
  });

  it("rejects patch with NaN values", () => {
    const raw = JSON.stringify({
      basePresetId: "archive",
      patch: { layerEffects: { background: { meltIntensity: NaN } } },
    });
    const result = parseAiMoodResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("finite number");
    }
  });

  it("parses JSON wrapped in markdown fences", () => {
    const raw = '```json\n{"basePresetId":"tape-worn"}\n```';
    const result = parseAiMoodResponse(raw);
    expect(result).toEqual({
      ok: true,
      data: { basePresetId: "tape-worn" },
    });
  });

  it("rejects unknown top-level keys", () => {
    const result = parseAiMoodResponse('{"basePresetId":"archive","extra":true}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Unknown top-level key");
    }
  });

  it("rejects empty basePresetId", () => {
    const result = parseAiMoodResponse('{"basePresetId":""}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("non-empty string");
    }
  });
});

describe("parseAiMoodResponse catalog coverage", () => {
  it.each(PRESET_CATALOG.map((e) => e.id))("accepts catalog id %s", (id) => {
    const result = parseAiMoodResponse(JSON.stringify({ basePresetId: id }));
    expect(result.ok).toBe(true);
  });
});
