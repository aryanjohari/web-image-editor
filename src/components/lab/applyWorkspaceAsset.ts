import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { useSynthStore } from "@/store/useSynthStore";
import { createProcessedDecalTexture } from "@/utils/decalTexture";
import { isHeroMime, isOverlayMime, type WorkspaceAsset } from "@/lib/stage/workspace";

function assetToFile(asset: WorkspaceAsset): File {
  return new File([asset.blob], asset.name || "asset.png", {
    type: asset.mime || "image/png",
  });
}

/** Load workspace asset into the hero (background) GPU slot. */
export async function applyWorkspaceAssetAsHero(asset: WorkspaceAsset): Promise<void> {
  if (!isHeroMime(asset.mime)) {
    throw new Error("Hero accepts JPG, PNG, or WebP.");
  }
  const file = assetToFile(asset);
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      new TextureLoader().load(
        objectUrl,
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
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Load workspace asset into the overlay (decal) GPU slot — PNG/WebP only. */
export async function applyWorkspaceAssetAsOverlay(asset: WorkspaceAsset): Promise<void> {
  if (!isOverlayMime(asset.mime)) {
    throw new Error("Overlay accepts PNG or WebP.");
  }
  const file = assetToFile(asset);
  const texture = await createProcessedDecalTexture(file);
  if (!texture) {
    throw new Error("Failed to process overlay texture.");
  }
  useSynthStore.getState().setDecalTexture(texture);
}
