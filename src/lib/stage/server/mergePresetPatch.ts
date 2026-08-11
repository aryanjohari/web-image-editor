/**
 * Pure PresetPatch → SynthPresetV2 merge (no Zustand).
 * Mirrors applyPresetPatch for server-side job recipe assembly.
 */

import { createDefaultLayerEffects } from "../../../store/layerEffects";
import {
  mergeLayerEffectsPatch,
  validatePresetPatch,
  type PresetPatch,
} from "../../preset/apply";
import type { SynthPresetV2 } from "../../preset/types";

/** Deep-clone base preset and apply a validated patch. */
export function mergePresetPatchIntoV2(base: SynthPresetV2, patch: PresetPatch): SynthPresetV2 {
  validatePresetPatch(patch);
  const next: SynthPresetV2 = structuredClone(base);

  if (patch.layerEffects) {
    next.layerEffects = mergeLayerEffectsPatch(next.layerEffects, patch.layerEffects);
  }

  const synthPatch = patch.synth;
  if (!synthPatch) return next;

  if (synthPatch.decalScale !== undefined) next.synth.decalScale = synthPatch.decalScale;
  if (synthPatch.decalOffsetX !== undefined) next.synth.decalOffsetX = synthPatch.decalOffsetX;
  if (synthPatch.decalOffsetY !== undefined) next.synth.decalOffsetY = synthPatch.decalOffsetY;
  if (synthPatch.decalBackgroundLumaMask !== undefined) {
    next.synth.decalBackgroundLumaMask = synthPatch.decalBackgroundLumaMask;
  }
  if (synthPatch.linkDecalToMath !== undefined) next.synth.linkDecalToMath = synthPatch.linkDecalToMath;
  if (synthPatch.linkTextToMath !== undefined) next.synth.linkTextToMath = synthPatch.linkTextToMath;

  if (synthPatch.textLayers !== undefined) {
    next.synth.textLayers = structuredClone(synthPatch.textLayers);
  }

  if (synthPatch.selectedTextLayerId !== undefined) {
    const ids = new Set(next.synth.textLayers.map((l) => l.id));
    next.synth.selectedTextLayerId = ids.has(synthPatch.selectedTextLayerId)
      ? synthPatch.selectedTextLayerId
      : (next.synth.textLayers[0]?.id ?? "");
  }

  if (synthPatch.textLayerEffects !== undefined) {
    const merged = { ...next.synth.textLayerEffects };
    for (const [id, partial] of Object.entries(synthPatch.textLayerEffects)) {
      merged[id] = {
        ...(merged[id] ?? createDefaultLayerEffects()),
        ...partial,
      };
    }
    next.synth.textLayerEffects = merged;
  }

  return next;
}
