import { describe, expect, it } from "vitest";
import { BG_SOFT_DRIFT } from "../../../data/backgroundPresets";
import { mergePresetPatchIntoV2 } from "./mergePresetPatch";

describe("mergePresetPatchIntoV2", () => {
  it("merges layerEffects without mutating base", () => {
    const before = BG_SOFT_DRIFT.layerEffects.background.meltIntensity;
    const next = mergePresetPatchIntoV2(BG_SOFT_DRIFT, {
      layerEffects: { background: { meltIntensity: 0.55 } },
    });
    expect(next.layerEffects.background.meltIntensity).toBe(0.55);
    expect(BG_SOFT_DRIFT.layerEffects.background.meltIntensity).toBe(before);
  });

  it("merges synth scalars and text layers", () => {
    const next = mergePresetPatchIntoV2(BG_SOFT_DRIFT, {
      synth: {
        decalScale: 1.25,
        textLayers: [
          {
            id: "t1",
            text: "Hello",
            color: "#fff",
            fontSize: 40,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            effectsLinked: true,
          },
        ],
        selectedTextLayerId: "t1",
      },
    });
    expect(next.synth.decalScale).toBe(1.25);
    expect(next.synth.textLayers[0]?.text).toBe("Hello");
    expect(next.synth.selectedTextLayerId).toBe("t1");
  });
});
