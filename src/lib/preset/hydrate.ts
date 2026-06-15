import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { createProcessedDecalTexture } from "@/utils/decalTexture";
import { createTextLayer } from "@/store/textLayers";
import { useSynthStore } from "@/store/useSynthStore";
import { applySynthFieldsFromV2 } from "./apply";
import type { SynthPresetAny, SynthPresetV1, SynthPresetV2 } from "./types";
import { PRESET_SCHEMA_VERSION } from "./types";
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

function hasPackedImageAssets(preset: SynthPresetV2): boolean {
  const { assets } = preset;
  if (!assets) return false;
  const bg = typeof assets.background?.dataBase64 === "string" && assets.background.dataBase64.length > 0;
  const dec = typeof assets.decal?.dataBase64 === "string" && assets.decal.dataBase64.length > 0;
  return bg || dec;
}

async function loadPresetAssets(preset: SynthPresetV2): Promise<void> {
  const store = useSynthStore.getState();

  if (!hasPackedImageAssets(preset)) {
    return;
  }

  store.setImageTexture(null);
  store.setDecalTexture(null);
  store.setImageResolution(preset.imageResolution);

  const assets = preset.assets;
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

/**
 * Apply a validated v1 preset: JSON params + optional embedded images.
 * Migrates legacy single-string text into one `TextLayer`.
 */
export async function applySynthPresetV1(preset: SynthPresetV1): Promise<void> {
  const s = preset.synth;
  const layer = createTextLayer({
    text: s.overlayText,
    color: s.textColor,
    fontSize: s.textSize,
    offsetX: s.textOffsetX,
    offsetY: s.textOffsetY,
    scale: s.textScale,
    effectsLinked: true,
  });

  const v2: SynthPresetV2 = {
    presetSchemaVersion: PRESET_SCHEMA_VERSION,
    engineVersion: preset.engineVersion,
    synth: {
      decalScale: s.decalScale,
      decalOffsetX: s.decalOffsetX,
      decalOffsetY: s.decalOffsetY,
      decalBackgroundLumaMask: 0,
      linkDecalToMath: s.linkDecalToMath,
      linkTextToMath: s.linkTextToMath,
      textLayers: [layer],
      selectedTextLayerId: layer.id,
      textLayerEffects: {},
    },
    layerEffects: preset.layerEffects,
    imageResolution: preset.imageResolution,
    viewport: preset.viewport,
    baseTimeSeconds: preset.baseTimeSeconds,
    assets: preset.assets,
  };

  await applySynthPresetV2(v2);
}

/** Apply a validated v2 preset. */
export async function applySynthPresetV2(preset: SynthPresetV2): Promise<void> {
  applySynthFieldsFromV2(preset);
  await loadPresetAssets(preset);
}

export async function applySynthPreset(preset: SynthPresetAny): Promise<void> {
  if (preset.presetSchemaVersion === 1) {
    await applySynthPresetV1(preset);
  } else {
    await applySynthPresetV2(preset);
  }
}
