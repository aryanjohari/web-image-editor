import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { createProcessedDecalTexture } from "@/utils/decalTexture";
import { useSynthStore } from "@/store/useSynthStore";
import type { SynthPresetV1 } from "./types";
import { base64ToBlob } from "./assets";

function loadBackgroundFromBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    new TextureLoader().load(
      objectUrl,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.needsUpdate = true;
        useSynthStore.getState().setImageTexture(texture);
        URL.revokeObjectURL(objectUrl);
        resolve();
      },
      undefined,
      (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err ?? new Error("TextureLoader failed"));
      },
    );
  });
}

/**
 * Apply a validated v1 preset: JSON params + optional embedded images.
 */
export async function applySynthPresetV1(preset: SynthPresetV1): Promise<void> {
  const store = useSynthStore.getState();

  store.replaceLayerEffects(structuredClone(preset.layerEffects));

  for (const key of [
    "overlayText",
    "textColor",
    "textSize",
    "decalScale",
    "decalOffsetX",
    "decalOffsetY",
    "linkDecalToMath",
    "textOffsetX",
    "textOffsetY",
    "textScale",
    "linkTextToMath",
  ] as const) {
    store.setParam(key, preset.synth[key]);
  }

  store.setImageTexture(null);
  store.setDecalTexture(null);
  store.setImageResolution(preset.imageResolution);

  const { assets } = preset;
  if (!assets) return;

  if (assets.background) {
    const blob = base64ToBlob(assets.background.mime, assets.background.dataBase64);
    await loadBackgroundFromBlob(blob);
  }

  if (assets.decal) {
    const blob = base64ToBlob(assets.decal.mime, assets.decal.dataBase64);
    const file = new File([blob], "preset-decal.png", { type: assets.decal.mime || "image/png" });
    const decalTex = await createProcessedDecalTexture(file);
    if (decalTex) {
      store.setDecalTexture(decalTex);
    }
  }
}
