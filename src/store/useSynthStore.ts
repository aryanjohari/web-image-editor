import { create } from "zustand";
import type { Texture } from "three";
import {
  type LayerEffectParams,
  type LayerEffectsMap,
  type LayerId,
  createDefaultLayerEffectsMap,
} from "@/store/layerEffects";

const DEBUG = true;

export type { LayerEffectParams, LayerId, LayerEffectsMap } from "@/store/layerEffects";

export type StackTab = LayerId;

function readImageDimensionsFromTexture(texture: Texture): { width: number; height: number } {
  const image = texture.image;
  if (image && typeof image === "object" && "width" in image && "height" in image) {
    const w = (image as { width: number }).width;
    const h = (image as { height: number }).height;
    if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
      return { width: w, height: h };
    }
  }
  return { width: 1, height: 1 };
}

/** Global synth fields (textures, text content, transforms, UI). Per-layer visuals live in `layerEffects`. */
export type SynthParams = {
  overlayText: string;
  textColor: string;
  textSize: number;
  decalScale: number;
  decalOffsetX: number;
  decalOffsetY: number;
  linkDecalToMath: boolean;
  textOffsetX: number;
  textOffsetY: number;
  textScale: number;
  linkTextToMath: boolean;
};

type SynthState = SynthParams & {
  layerEffects: LayerEffectsMap;
  stackTab: StackTab;
  panelOpen: boolean;
  imageTexture: Texture | null;
  imageResolution: { width: number; height: number };
  decalTexture: Texture | null;
  setParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setLayerEffect: <K extends keyof LayerEffectParams>(
    layer: LayerId,
    key: K,
    value: LayerEffectParams[K],
  ) => void;
  replaceLayerEffects: (next: LayerEffectsMap) => void;
  setImageResolution: (resolution: { width: number; height: number }) => void;
  setPanelOpen: (open: boolean) => void;
  setImageTexture: (texture: Texture | null) => void;
  setDecalTexture: (texture: Texture | null) => void;
  updateDecalOffset: (deltaX: number, deltaY: number) => void;
  updateTextOffset: (deltaX: number, deltaY: number) => void;
  setStackTab: (tab: StackTab) => void;
};

export const useSynthStore = create<SynthState>((set) => ({
  layerEffects: createDefaultLayerEffectsMap(),
  overlayText: "",
  textColor: "#ffffff",
  textSize: 100,
  decalScale: 1.0,
  decalOffsetX: 0.0,
  decalOffsetY: 0.0,
  linkDecalToMath: false,
  textOffsetX: 0.0,
  textOffsetY: 0.0,
  textScale: 1.0,
  linkTextToMath: false,
  stackTab: "background",
  panelOpen: true,
  imageTexture: null,
  imageResolution: { width: 1, height: 1 },
  decalTexture: null,
  setParam: (key, value) => set({ [key]: value } as Pick<SynthState, typeof key>),
  setLayerEffect: (layer, key, value) =>
    set((state) => ({
      layerEffects: {
        ...state.layerEffects,
        [layer]: { ...state.layerEffects[layer], [key]: value },
      },
    })),
  replaceLayerEffects: (next) => set({ layerEffects: structuredClone(next) }),
  setImageResolution: (resolution) => set({ imageResolution: { ...resolution } }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setImageTexture: (texture) => {
    if (DEBUG) {
      console.debug("[useSynthStore] setImageTexture called", {
        ts: new Date().toISOString(),
        payload: texture,
      });
    }
    if (!texture) {
      set({ imageTexture: null, imageResolution: { width: 1, height: 1 } });
      return;
    }
    set({
      imageTexture: texture,
      imageResolution: readImageDimensionsFromTexture(texture),
    });
  },
  setDecalTexture: (texture) => {
    if (DEBUG) {
      console.debug("[useSynthStore] setDecalTexture called", {
        ts: new Date().toISOString(),
        payload: texture,
      });
    }
    set((state) => {
      const prev = state.decalTexture;
      if (prev && prev !== texture) {
        prev.dispose();
      }
      if (!texture) {
        return { decalTexture: null };
      }
      return { decalTexture: texture };
    });
  },
  updateDecalOffset: (deltaX, deltaY) =>
    set((state) => ({
      decalOffsetX: state.decalOffsetX + deltaX,
      decalOffsetY: state.decalOffsetY + deltaY,
    })),
  updateTextOffset: (deltaX, deltaY) =>
    set((state) => ({
      textOffsetX: state.textOffsetX + deltaX,
      textOffsetY: state.textOffsetY + deltaY,
    })),
  setStackTab: (tab) => set({ stackTab: tab }),
}));
