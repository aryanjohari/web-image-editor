import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { UploadButton } from "@/components/UploadButton";
import { useSynthStore } from "@/store/useSynthStore";
import { createProcessedDecalTexture } from "@/utils/decalTexture";
import {
  addLabStageAsset,
  getLabStageAssets,
  readFileAsBase64,
  removeLabStageAsset,
  setLabStageAssetGpuSlot,
  subscribeLabStageDraft,
  type LabStageAssetEntry,
} from "@/lib/stage/labStageDraft";
import { STAGE_BG_ASSET_ID } from "@/lib/stage/adaptPreset";

/**
 * Lab Source: clear Upload hero / overlay (synced to Stage draft) + multi-add.
 * GPU compose = one hero + one overlay; extras stay listed for StageRecipe export.
 */
export function StageAssetList() {
  const extrasInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<readonly LabStageAssetEntry[]>(() => getLabStageAssets());
  const setImageTexture = useSynthStore((s) => s.setImageTexture);
  const setDecalTexture = useSynthStore((s) => s.setDecalTexture);

  useEffect(() => subscribeLabStageDraft(() => setEntries([...getLabStageAssets()])), []);

  const loadBackgroundFile = async (file: File, entryId: string) => {
    const objectUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      new TextureLoader().load(
        objectUrl,
        (texture) => {
          texture.colorSpace = SRGBColorSpace;
          texture.generateMipmaps = false;
          texture.minFilter = LinearFilter;
          texture.magFilter = LinearFilter;
          texture.needsUpdate = true;
          setImageTexture(texture);
          URL.revokeObjectURL(objectUrl);
          setLabStageAssetGpuSlot(entryId, "background");
          resolve();
        },
        undefined,
        (err) => {
          URL.revokeObjectURL(objectUrl);
          reject(err ?? new Error("TextureLoader failed"));
        },
      );
    });
  };

  const loadDecalFile = async (file: File, entryId: string) => {
    const texture = await createProcessedDecalTexture(file);
    if (texture) {
      setDecalTexture(texture);
      setLabStageAssetGpuSlot(entryId, "decal");
    }
  };

  /**
   * Multi-select: 1st file always replaces hero on the canvas; further files are listed extras.
   * Never silently skip GPU load for the primary add (including when a demo hero is already set).
   */
  const onAddImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;

    const list = Array.from(files);
    for (let i = 0; i < list.length; i += 1) {
      const file = list[i]!;
      try {
        const { mime, dataBase64 } = await readFileAsBase64(file);
        if (i === 0) {
          const entry = addLabStageAsset({
            label: file.name,
            mime,
            dataBase64,
            objectUrl: `data:${mime};base64,${dataBase64}`,
            preferredId: STAGE_BG_ASSET_ID,
            gpuSlot: "background",
            kind: "image",
          });
          await loadBackgroundFile(file, entry.id);
        } else {
          addLabStageAsset({
            label: file.name,
            mime,
            dataBase64,
            objectUrl: `data:${mime};base64,${dataBase64}`,
            gpuSlot: null,
            kind: "image",
          });
        }
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Failed to add image");
      }
    }
  };

  const assignHero = async (entry: LabStageAssetEntry) => {
    if (!entry.dataBase64) {
      window.alert("Asset has no embedded bytes to load.");
      return;
    }
    const mime = entry.mime ?? "image/png";
    const binary = atob(entry.dataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], entry.label || "hero.png", { type: mime });
    await loadBackgroundFile(file, entry.id);
  };

  const assignDecal = async (entry: LabStageAssetEntry) => {
    if (!entry.dataBase64) {
      window.alert("Asset has no embedded bytes to load.");
      return;
    }
    const mime = entry.mime ?? "image/png";
    const binary = atob(entry.dataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], entry.label || "decal.png", { type: mime });
    await loadDecalFile(file, entry.id);
  };

  const onRemove = (entry: LabStageAssetEntry) => {
    if (entry.gpuSlot === "background") setImageTexture(null);
    if (entry.gpuSlot === "decal") setDecalTexture(null);
    removeLabStageAsset(entry.id);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-[10px] leading-relaxed text-zinc-500">
        Canvas shows one hero + one overlay. Extra assets stay in this list for StageRecipe export —
        they are not all composited on the GPU yet.
      </p>

      <UploadButton variant="background" />
      <UploadButton variant="decal" />

      <input
        ref={extrasInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void onAddImages(e)}
      />
      <button
        type="button"
        className="border border-white/35 px-3 py-2 text-xs uppercase tracking-wide text-zinc-200 transition hover:border-white hover:text-white"
        onClick={() => extrasInputRef.current?.click()}
        title="First file replaces the hero; additional files are listed only"
      >
        Add images
      </button>
      <p className="text-[10px] leading-relaxed text-zinc-600">
        Add images: first file replaces the hero; the rest are listed only (use row actions to bind).
      </p>

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-2 border border-white/20 p-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1 border-b border-white/10 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-zinc-200">{entry.label}</p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {entry.gpuSlot === "background"
                      ? "Hero (GPU)"
                      : entry.gpuSlot === "decal"
                        ? "Overlay (GPU)"
                        : "Listed only"}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-[10px] uppercase text-zinc-500 hover:text-white"
                  onClick={() => onRemove(entry)}
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-300 hover:border-white hover:text-white disabled:opacity-40"
                  onClick={() => void assignHero(entry)}
                  disabled={entry.gpuSlot === "background"}
                >
                  Use as hero
                </button>
                <button
                  type="button"
                  className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-300 hover:border-white hover:text-white disabled:opacity-40"
                  onClick={() => void assignDecal(entry)}
                  disabled={entry.gpuSlot === "decal"}
                >
                  Use as overlay
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
