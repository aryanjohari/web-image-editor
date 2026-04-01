import { create } from "zustand";
import type { Texture } from "three";

const DEBUG = true;

export type SynthParams = {
  meltIntensity: number;
  colorBleed: number;
  noiseLevel: number;
  posterizeSteps: number;
  timeScale: number;
};

type SynthState = SynthParams & {
  panelOpen: boolean;
  imageTexture: Texture | null;
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
  panelOpen: true,
  imageTexture: null,
  setParam: (key, value) => set({ [key]: value } as Pick<SynthState, typeof key>),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setImageTexture: (texture) => {
    if (DEBUG) {
      console.debug("[useSynthStore] setImageTexture called", {
        ts: new Date().toISOString(),
        payload: texture,
      });
    }
    set({ imageTexture: texture });
  },
}));
