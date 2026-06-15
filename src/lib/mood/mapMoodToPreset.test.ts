import { describe, expect, it } from "vitest";
import { mapMoodToPreset, MOOD_FALLBACK_PRESET_ID } from "@/lib/mood/mapMoodToPreset";

/**
 * Tie-break: when multiple catalog entries share the best score, the first match
 * in PRESET_CATALOG iteration order wins (e.g. acid-noir before strobe-haze for "neon").
 */
describe("mapMoodToPreset", () => {
  it('maps "glitch" to glitch-core', () => {
    const result = mapMoodToPreset("glitch");
    expect(result.presetId).toBe("glitch-core");
    expect(result.fallback).toBeUndefined();
  });

  it('maps "vintage neon" to acid-noir (neon tie-break)', () => {
    const result = mapMoodToPreset("vintage neon");
    expect(result.presetId).toBe("acid-noir");
    expect(result.fallback).toBeUndefined();
  });

  it('maps "neon" to acid-noir (catalog order tie-break)', () => {
    const result = mapMoodToPreset("neon");
    expect(result.presetId).toBe("acid-noir");
    expect(result.fallback).toBeUndefined();
  });

  it('maps "cold clinical" to cold-scan', () => {
    const result = mapMoodToPreset("cold clinical");
    expect(result.presetId).toBe("cold-scan");
    expect(result.fallback).toBeUndefined();
  });

  it("falls back to archive for unknown input", () => {
    expect(mapMoodToPreset("asdfqwer")).toEqual({
      presetId: MOOD_FALLBACK_PRESET_ID,
      score: 0,
      fallback: true,
    });
  });

  it.each(["", "   "])("falls back to archive for empty input %j", (input) => {
    expect(mapMoodToPreset(input)).toEqual({
      presetId: MOOD_FALLBACK_PRESET_ID,
      score: 0,
      fallback: true,
    });
  });

  it('applies slower modifier patch for "slower glitch"', () => {
    const result = mapMoodToPreset("slower glitch");
    expect(result.presetId).toBe("glitch-core");
    expect(result.fallback).toBeUndefined();
    expect(result.patch?.layerEffects?.background?.timeScale).toBe(0.35);
  });
});
