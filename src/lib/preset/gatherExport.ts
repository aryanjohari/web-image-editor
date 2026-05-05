import type { BuildPresetInput } from "./buildPreset";
import { encodeTextureToPngAsset } from "./assets";
import { getLastBaseTimeSeconds, readCanvasViewportSnapshot } from "./snapshot";
import { useSynthStore } from "@/store/useSynthStore";

export async function gatherPresetExportInput(
  canvas: HTMLCanvasElement,
  includeAssets: boolean,
): Promise<BuildPresetInput> {
  const s = useSynthStore.getState();
  const viewport = readCanvasViewportSnapshot(canvas);
  const baseTimeSeconds = getLastBaseTimeSeconds();

  let assets: BuildPresetInput["assets"];
  if (includeAssets) {
    const background = await encodeTextureToPngAsset(s.imageTexture);
    const decal = await encodeTextureToPngAsset(s.decalTexture);
    assets = {};
    if (background) assets.background = background;
    if (decal) assets.decal = decal;
    if (Object.keys(assets).length === 0) assets = undefined;
  }

  return {
    synth: {
      decalScale: s.decalScale,
      decalOffsetX: s.decalOffsetX,
      decalOffsetY: s.decalOffsetY,
      decalBackgroundLumaMask: s.decalBackgroundLumaMask,
      linkDecalToMath: s.linkDecalToMath,
      linkTextToMath: s.linkTextToMath,
      textLayers: structuredClone(s.textLayers),
      selectedTextLayerId: s.selectedTextLayerId,
      textLayerEffects: structuredClone(s.textLayerEffects),
    },
    layerEffects: s.layerEffects,
    imageResolution: { ...s.imageResolution },
    viewport,
    baseTimeSeconds,
    assets,
  };
}
