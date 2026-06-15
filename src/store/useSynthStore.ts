import { create } from "zustand";
import type { Texture } from "three";
import {
  type LayerEffectParams,
  type LayerEffectsMap,
  type LayerId,
  createDefaultLayerEffects,
  createDefaultLayerEffectsMap,
} from "@/store/layerEffects";
import {
  MAX_TEXT_LAYERS,
  type TextLayer,
  createTextLayer,
  initialTextLayersBootstrap,
} from "@/store/textLayers";

const DEBUG = false;

export type { LayerEffectParams, LayerId, LayerEffectsMap } from "@/store/layerEffects";
export type { TextLayer } from "@/store/textLayers";

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

/** Global synth fields (textures, transforms, UI). Per-layer visuals live in `layerEffects`; text stacks use `textLayers` + optional `textLayerEffects`. */
export type SynthParams = {
  decalScale: number;
  decalOffsetX: number;
  decalOffsetY: number;
  /** 0 = normal alpha-over; 1 = multiply background by decal texture luminance (per sampled decal pixel). */
  decalBackgroundLumaMask: number;
  linkDecalToMath: boolean;
  linkTextToMath: boolean;
};

type SynthState = SynthParams & {
  textLayers: TextLayer[];
  selectedTextLayerId: string;
  /** Private effect params for text layers with `effectsLinked === false`. */
  textLayerEffects: Record<string, LayerEffectParams>;
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
  setTextLayers: (layers: TextLayer[]) => void;
  setSelectedTextLayerId: (id: string) => void;
  setTextLayerEffects: (next: Record<string, LayerEffectParams>) => void;
  addTextLayer: () => void;
  removeTextLayer: (id: string) => void;
  updateTextLayer: (id: string, partial: Partial<TextLayer>) => void;
  setTextLayerEffectsLinked: (id: string, linked: boolean) => void;
  setTextLayerEffect: <K extends keyof LayerEffectParams>(
    textLayerId: string,
    key: K,
    value: LayerEffectParams[K],
  ) => void;
  setImageResolution: (resolution: { width: number; height: number }) => void;
  setPanelOpen: (open: boolean) => void;
  setImageTexture: (texture: Texture | null) => void;
  setDecalTexture: (texture: Texture | null) => void;
  updateDecalOffset: (deltaX: number, deltaY: number) => void;
  updateSelectedTextLayerOffset: (deltaX: number, deltaY: number) => void;
  setStackTab: (tab: StackTab) => void;
  /** Restore default layer effects, decal/text transforms, and a fresh single text layer. Keeps uploaded images. */
  resetSynthLookToDefaults: () => void;
};

const bootstrap = initialTextLayersBootstrap();

export const useSynthStore = create<SynthState>((set) => ({
  layerEffects: createDefaultLayerEffectsMap(),
  textLayers: bootstrap.textLayers,
  selectedTextLayerId: bootstrap.selectedTextLayerId,
  textLayerEffects: {},
  decalScale: 1.0,
  decalOffsetX: 0.0,
  decalOffsetY: 0.0,
  decalBackgroundLumaMask: 0.0,
  linkDecalToMath: false,
  linkTextToMath: false,
  stackTab: "background",
  panelOpen: false,
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
  setTextLayers: (textLayers) => set({ textLayers }),
  setSelectedTextLayerId: (selectedTextLayerId) => set({ selectedTextLayerId }),
  setTextLayerEffects: (textLayerEffects) => set({ textLayerEffects: structuredClone(textLayerEffects) }),
  addTextLayer: () =>
    set((state) => {
      if (state.textLayers.length >= MAX_TEXT_LAYERS) return state;
      const next = createTextLayer();
      return {
        textLayers: [...state.textLayers, next],
        selectedTextLayerId: next.id,
      };
    }),
  removeTextLayer: (id) =>
    set((state) => {
      const textLayers = state.textLayers.filter((l) => l.id !== id);
      const restEffects = { ...state.textLayerEffects };
      delete restEffects[id];
      let selectedTextLayerId = state.selectedTextLayerId;
      if (selectedTextLayerId === id) {
        selectedTextLayerId = textLayers[0]?.id ?? "";
      }
      return { textLayers, textLayerEffects: restEffects, selectedTextLayerId };
    }),
  updateTextLayer: (id, partial) =>
    set((state) => ({
      textLayers: state.textLayers.map((l) => (l.id === id ? { ...l, ...partial } : l)),
    })),
  setTextLayerEffectsLinked: (id, linked) =>
    set((state) => {
      const layer = state.textLayers.find((l) => l.id === id);
      if (!layer) return state;
      const nextLayers = state.textLayers.map((l) =>
        l.id === id ? { ...l, effectsLinked: linked } : l,
      );
      let nextEffects = { ...state.textLayerEffects };
      if (linked) {
        const rest = { ...nextEffects };
        delete rest[id];
        nextEffects = rest;
      } else {
        nextEffects = {
          ...nextEffects,
          [id]: structuredClone(state.layerEffects.text),
        };
      }
      return { textLayers: nextLayers, textLayerEffects: nextEffects };
    }),
  setTextLayerEffect: (textLayerId, key, value) =>
    set((state) => ({
      textLayerEffects: {
        ...state.textLayerEffects,
        [textLayerId]: {
          ...(state.textLayerEffects[textLayerId] ?? createDefaultLayerEffects()),
          [key]: value,
        },
      },
    })),
  setImageResolution: (resolution) => set({ imageResolution: { ...resolution } }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setImageTexture: (texture) =>
    set((state) => {
      if (DEBUG) {
        console.debug("[useSynthStore] setImageTexture called", {
          ts: new Date().toISOString(),
          payload: texture,
        });
      }
      const prev = state.imageTexture;
      if (prev && prev !== texture) {
        prev.dispose();
      }
      if (!texture) {
        return { imageTexture: null, imageResolution: { width: 1, height: 1 } };
      }
      return {
        imageTexture: texture,
        imageResolution: readImageDimensionsFromTexture(texture),
      };
    }),
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
  updateSelectedTextLayerOffset: (deltaX, deltaY) =>
    set((state) => {
      const id = state.selectedTextLayerId;
      if (!id) return state;
      return {
        textLayers: state.textLayers.map((l) =>
          l.id === id
            ? { ...l, offsetX: l.offsetX + deltaX, offsetY: l.offsetY + deltaY }
            : l,
        ),
      };
    }),
  setStackTab: (tab) => set({ stackTab: tab }),
  resetSynthLookToDefaults: () => {
    const b = initialTextLayersBootstrap();
    set({
      layerEffects: createDefaultLayerEffectsMap(),
      decalScale: 1.0,
      decalOffsetX: 0.0,
      decalOffsetY: 0.0,
      decalBackgroundLumaMask: 0.0,
      linkDecalToMath: false,
      linkTextToMath: false,
      textLayers: b.textLayers,
      selectedTextLayerId: b.selectedTextLayerId,
      textLayerEffects: {},
    });
  },
}));
