import { describe, expect, it } from "vitest";
import {
  clampPatchToBrandLimits,
  parseStageBriefResponse,
} from "@/lib/stage/validateBriefPatch";
import type { StageBrandKit } from "@/lib/stage/types";

const brandWithLimits: StageBrandKit = {
  id: "b",
  name: "Limited",
  colors: [{ id: "c1", hex: "#111111" }],
  fonts: [],
  limits: {
    allowedLookIds: ["soft-drift", "film-grain"],
    maxMeltIntensity: 0.3,
    maxNoiseLevel: 0.2,
    maxScanlineIntensity: 0.4,
  },
};

describe("parseStageBriefResponse", () => {
  it("parses patch + baseLookId + summary", () => {
    const raw = JSON.stringify({
      baseLookId: "soft-drift",
      summary: "Calm drift",
      patch: {
        layerEffects: { background: { timeScale: 0.5, colorA: "#112233" } },
      },
    });
    const result = parseStageBriefResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.baseLookId).toBe("soft-drift");
      expect(result.data.summary).toBe("Calm drift");
      expect(result.data.patch.layerEffects?.background?.timeScale).toBe(0.5);
    }
  });

  it("accepts basePresetId alias", () => {
    const result = parseStageBriefResponse('{"basePresetId":"archive","patch":{}}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.baseLookId).toBe("archive");
  });

  it("rejects unknown look id", () => {
    const result = parseStageBriefResponse('{"baseLookId":"not-a-look"}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Unknown look");
  });

  it("rejects look outside brand allowlist", () => {
    const result = parseStageBriefResponse('{"baseLookId":"glitch-core"}', {
      brand: brandWithLimits,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not allowed");
  });

  it("rejects unknown patch keys", () => {
    const raw = JSON.stringify({
      patch: { assets: { evil: true } },
    });
    const result = parseStageBriefResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Unknown key");
  });

  it("rejects unknown layer effect fields", () => {
    const raw = JSON.stringify({
      patch: { layerEffects: { background: { secretShader: 1 } } },
    });
    const result = parseStageBriefResponse(raw);
    expect(result.ok).toBe(false);
  });

  it("rejects empty response without patch or look", () => {
    const result = parseStageBriefResponse('{"summary":"hi"}');
    expect(result.ok).toBe(false);
  });

  it("parses markdown-fenced JSON", () => {
    const raw = '```json\n{"baseLookId":"tape-worn"}\n```';
    const result = parseStageBriefResponse(raw);
    expect(result.ok).toBe(true);
  });

  it("clamps intensities to brand limits", () => {
    const raw = JSON.stringify({
      baseLookId: "soft-drift",
      patch: {
        layerEffects: {
          background: { meltIntensity: 0.9, noiseLevel: 0.8, scanlineIntensity: 0.9 },
        },
      },
    });
    const result = parseStageBriefResponse(raw, { brand: brandWithLimits });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const bg = result.data.patch.layerEffects?.background;
      expect(bg?.meltIntensity).toBe(0.3);
      expect(bg?.noiseLevel).toBe(0.2);
      expect(bg?.scanlineIntensity).toBe(0.4);
    }
  });
});

describe("clampPatchToBrandLimits", () => {
  it("is a no-op without limits", () => {
    const patch = { layerEffects: { background: { meltIntensity: 0.9 } } };
    expect(clampPatchToBrandLimits(patch)).toEqual(patch);
  });
});
