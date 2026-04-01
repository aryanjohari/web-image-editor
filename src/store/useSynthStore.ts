import { create } from "zustand";
import type { Texture } from "three";

const DEBUG = true;

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

export type SynthParams = {
  meltIntensity: number;
  colorBleed: number;
  noiseLevel: number;
  posterizeSteps: number;
  timeScale: number;
  maskCenterX: number;
  maskCenterY: number;
  maskRadius: number;
  twirlIntensity: number;
  colorA: string;
  colorB: string;
  duotoneBlend: number;
  colorCycleSpeed: number;
  halftoneIntensity: number;
  scanlineIntensity: number;
  overlayText: string;
  textColor: string;
  textSize: number;
  /** Foreground decal (sticker) — PNG with alpha or driven by text-to-texture later. */
  decalScale: number;
  decalOffsetX: number;
  decalOffsetY: number;
  /** When true, decal sampling follows the same distortion math as the background (shader hook TBD). */
  linkDecalToMath: boolean;
  /** Text overlay layer (separate from uploaded decal). When no decal image is set, placement uses decal offset/scale for backward compatibility. */
  textOffsetX: number;
  textOffsetY: number;
  textScale: number;
  linkTextToMath: boolean;
};

export type StackTab = "background" | "decal" | "text";

type SynthState = SynthParams & {
  stackTab: StackTab;
  panelOpen: boolean;
  imageTexture: Texture | null;
  /** Native pixel size of the uploaded image (for shader object-fit: cover). */
  imageResolution: { width: number; height: number };
  decalTexture: Texture | null;
  setParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setPanelOpen: (open: boolean) => void;
  setImageTexture: (texture: Texture | null) => void;
  setDecalTexture: (texture: Texture | null) => void;
  /** Delta in normalized canvas space (~UV); Y is already oriented for shader offsets. */
  updateDecalOffset: (deltaX: number, deltaY: number) => void;
  updateTextOffset: (deltaX: number, deltaY: number) => void;
  setStackTab: (tab: StackTab) => void;
};

export const useSynthStore = create<SynthState>((set) => ({
  meltIntensity: 0.15,
  colorBleed: 0.2,
  noiseLevel: 0.04,
  posterizeSteps: 8,
  timeScale: 1.0,
  maskCenterX: 0.5,
  maskCenterY: 0.5,
  maskRadius: 0.5,
  twirlIntensity: 0.0,
  colorA: "#000000",
  colorB: "#ffffff",
  duotoneBlend: 0.0,
  colorCycleSpeed: 0,
  halftoneIntensity: 0,
  scanlineIntensity: 0,
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
