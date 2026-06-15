import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { LANDING_HOME_PRESET } from "@/data/landingHomePreset";
import { applySynthPreset } from "@/lib/preset/hydrate";
import { validatePreset } from "@/lib/preset/validate";
import { useSynthStore } from "@/store/useSynthStore";

export const HERO_IMAGE_URL = "/demo/hero.jpg";

function loadHeroTexture(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    new TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.needsUpdate = true;
        useSynthStore.getState().setImageTexture(texture);
        resolve();
      },
      undefined,
      (err) => reject(err ?? new Error("TextureLoader failed")),
    );
  });
}

/**
 * Landing-only init: clear decal, load hero background, then apply preset.
 * Texture before preset — preset has no assets so loadPresetAssets is a no-op.
 */
export async function initLandingHero(): Promise<void> {
  const store = useSynthStore.getState();
  store.setDecalTexture(null);
  store.setPanelOpen(false);

  await loadHeroTexture(HERO_IMAGE_URL);

  const preset = validatePreset(LANDING_HOME_PRESET);
  await applySynthPreset(preset);
}
