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
};

type SynthState = SynthParams & {
  panelOpen: boolean;
  imageTexture: Texture | null;
  /** Native pixel size of the uploaded image (for shader object-fit: cover). */
  imageResolution: { width: number; height: number };
  setParam: <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => void;
  setPanelOpen: (open: boolean) => void;
  setImageTexture: (texture: Texture | null) => void;
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
  panelOpen: true,
  imageTexture: null,
  imageResolution: { width: 1, height: 1 },
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
}));
