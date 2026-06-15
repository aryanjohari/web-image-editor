import { useSynthStore } from "@/store/useSynthStore";
import { createDefaultLayerEffectsMap } from "@/store/layerEffects";
import { initialTextLayersBootstrap } from "@/store/textLayers";

export function resetSynthStore() {
  const boot = initialTextLayersBootstrap();
  useSynthStore.setState({
    layerEffects: createDefaultLayerEffectsMap(),
    textLayers: boot.textLayers,
    selectedTextLayerId: boot.selectedTextLayerId,
    textLayerEffects: {},
    decalScale: 1,
    decalOffsetX: 0,
    decalOffsetY: 0,
    decalBackgroundLumaMask: 0,
    linkDecalToMath: false,
    linkTextToMath: false,
    imageTexture: null,
    decalTexture: null,
    imageResolution: { width: 1, height: 1 },
    panelOpen: false,
    stackTab: "background",
  });
}
