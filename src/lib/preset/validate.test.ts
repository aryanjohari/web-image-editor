import { describe, expect, it } from "vitest";
import { PRESET_CATALOG } from "@/data/presetCatalog";
import { LANDING_HOME_PRESET } from "@/data/landingHomePreset";
import { validatePresetV2 } from "@/lib/preset/validate";

describe("preset validation", () => {
  it.each(PRESET_CATALOG.map((e) => [e.id, e.preset] as const))(
    "validates catalog preset %s",
    (_id, preset) => {
      expect(() => validatePresetV2(preset)).not.toThrow();
    },
  );

  it("validates landing home preset", () => {
    expect(() => validatePresetV2(LANDING_HOME_PRESET)).not.toThrow();
  });

  it("catalog presets have no embedded assets", () => {
    for (const entry of PRESET_CATALOG) {
      expect(entry.preset.assets).toBeUndefined();
    }
  });
});
