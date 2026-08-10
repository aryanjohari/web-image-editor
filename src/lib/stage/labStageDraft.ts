/**
 * Lab-only Stage asset list (module-level, not Zustand).
 *
 * Recipes may describe N image assets/layers. The WebGL compositor still only has
 * hero (L0) + decal (L1) slots — extras stay here for export and assignment UI.
 */

import type {
  StageAssetKind,
  StageAssetRef,
  StageImageLayer,
  StageLayer,
  StageLayerEffects,
  StageLayerTransform,
} from "./types";
import { STAGE_BG_ASSET_ID, STAGE_DECAL_ASSET_ID } from "./adaptPreset";

function defaultTransform(): StageLayerTransform {
  return { offsetX: 0, offsetY: 0, scale: 1, rotationDeg: 0 };
}

function defaultEffects(): StageLayerEffects {
  return {
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
  };
}
export type LabStageAssetEntry = {
  id: string;
  kind: StageAssetKind;
  label: string;
  mime?: string;
  dataBase64?: string;
  /** Object URL for local preview; revoked on remove/clear */
  objectUrl?: string;
  width?: number;
  height?: number;
  /** Which compositor slot this asset is bound to (at most one per slot). */
  gpuSlot: "background" | "decal" | null;
};

type Listener = () => void;

let assets: LabStageAssetEntry[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

export function subscribeLabStageDraft(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLabStageAssets(): readonly LabStageAssetEntry[] {
  return assets;
}

export function clearLabStageDraft(): void {
  for (const a of assets) {
    if (a.objectUrl) URL.revokeObjectURL(a.objectUrl);
  }
  assets = [];
  notify();
}

function uniquifyId(base: string): string {
  if (!assets.some((a) => a.id === base)) return base;
  let n = 2;
  while (assets.some((a) => a.id === `${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

export type AddLabStageAssetInput = {
  kind?: StageAssetKind;
  label: string;
  mime?: string;
  dataBase64?: string;
  objectUrl?: string;
  width?: number;
  height?: number;
  /** Prefer this id when free (e.g. asset_background). */
  preferredId?: string;
  gpuSlot?: "background" | "decal" | null;
};

export function addLabStageAsset(input: AddLabStageAssetInput): LabStageAssetEntry {
  const preferred =
    input.preferredId ??
    (input.gpuSlot === "background"
      ? STAGE_BG_ASSET_ID
      : input.gpuSlot === "decal"
        ? STAGE_DECAL_ASSET_ID
        : `asset_${crypto.randomUUID().slice(0, 8)}`);
  const id = uniquifyId(preferred);

  let gpuSlot = input.gpuSlot ?? null;
  if (gpuSlot) {
    assets = assets.map((a) => (a.gpuSlot === gpuSlot ? { ...a, gpuSlot: null } : a));
  }

  const entry: LabStageAssetEntry = {
    id,
    kind: input.kind ?? (gpuSlot === "decal" ? "decal" : "image"),
    label: input.label,
    mime: input.mime,
    dataBase64: input.dataBase64,
    objectUrl: input.objectUrl,
    width: input.width,
    height: input.height,
    gpuSlot,
  };
  assets = [...assets, entry];
  notify();
  return entry;
}

export function removeLabStageAsset(id: string): void {
  const found = assets.find((a) => a.id === id);
  if (found?.objectUrl) URL.revokeObjectURL(found.objectUrl);
  assets = assets.filter((a) => a.id !== id);
  notify();
}

export function setLabStageAssetGpuSlot(
  id: string,
  slot: "background" | "decal" | null,
): LabStageAssetEntry | undefined {
  if (slot) {
    assets = assets.map((a) => {
      if (a.id === id) return a;
      if (a.gpuSlot === slot) return { ...a, gpuSlot: null };
      return a;
    });
  }
  assets = assets.map((a) => {
    if (a.id !== id) return a;
    const kind: StageAssetKind = slot === "decal" ? "decal" : a.kind === "logo" ? "logo" : "image";
    return { ...a, gpuSlot: slot, kind: slot === "decal" ? "decal" : kind };
  });
  notify();
  return assets.find((a) => a.id === id);
}

export function getLabStageAssetBySlot(slot: "background" | "decal"): LabStageAssetEntry | undefined {
  return assets.find((a) => a.gpuSlot === slot);
}

/** Replace draft from a StageRecipe's assets map (import path). */
export function replaceLabStageDraftFromRecipeAssets(
  recipeAssets: Record<string, StageAssetRef>,
  primaryBgId?: string,
  primaryDecalId?: string,
): void {
  clearLabStageDraft();
  const bgId = primaryBgId ?? STAGE_BG_ASSET_ID;
  const decalId = primaryDecalId ?? STAGE_DECAL_ASSET_ID;
  for (const [id, ref] of Object.entries(recipeAssets)) {
    let objectUrl: string | undefined;
    if (ref.dataBase64) {
      const mime = ref.mime ?? "image/png";
      objectUrl = `data:${mime};base64,${ref.dataBase64}`;
    } else if (ref.url) {
      objectUrl = ref.url;
    }
    const gpuSlot: LabStageAssetEntry["gpuSlot"] =
      id === bgId ? "background" : id === decalId ? "decal" : null;
    addLabStageAsset({
      preferredId: id,
      kind: ref.kind,
      label: id,
      mime: ref.mime,
      dataBase64: ref.dataBase64,
      objectUrl,
      width: ref.width,
      height: ref.height,
      gpuSlot,
    });
  }
}

/** Assets + extra image layers (not primary bg/decal) for recipe merge on export. */
export function collectLabDraftExtrasForRecipe(primaryBgId: string, primaryDecalId: string): {
  assets: Record<string, StageAssetRef>;
  extraLayers: StageLayer[];
} {
  const outAssets: Record<string, StageAssetRef> = {};
  const extraLayers: StageLayer[] = [];
  let z = 100;

  for (const entry of assets) {
    if (!entry.dataBase64 && !entry.objectUrl) continue;
    const ref: StageAssetRef = {
      id: entry.id,
      kind: entry.kind,
      mime: entry.mime,
      dataBase64: entry.dataBase64,
      width: entry.width,
      height: entry.height,
      ...(entry.objectUrl && !entry.dataBase64 ? { url: entry.objectUrl } : {}),
    };
    outAssets[entry.id] = ref;

    const isPrimarySlot =
      (entry.gpuSlot === "background" && entry.id === primaryBgId) ||
      (entry.gpuSlot === "decal" && entry.id === primaryDecalId) ||
      entry.id === STAGE_BG_ASSET_ID ||
      entry.id === STAGE_DECAL_ASSET_ID;

    // Adaptor already emits primary bg/decal layers; only add extras as image layers.
    if (!isPrimarySlot && entry.gpuSlot !== "decal" && entry.kind !== "decal") {
      const layer: StageImageLayer = {
        type: "image",
        id: `layer_${entry.id}`,
        assetId: entry.id,
        transform: defaultTransform(),
        effects: defaultEffects(),
        zIndex: z++,
        visible: true,
      };
      extraLayers.push(layer);
    }
  }

  return { assets: outAssets, extraLayers };
}

/** File → base64 helper for lab uploads. */
export function readFileAsBase64(file: File): Promise<{ mime: string; dataBase64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const m = /^data:([^;]+);base64,(.+)$/.exec(result);
      if (!m) {
        reject(new Error("Unexpected data URL"));
        return;
      }
      resolve({ mime: m[1], dataBase64: m[2] });
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Register / replace the Stage draft entry bound to a GPU slot (UploadButton sync).
 * Updates the current slot holder in place when possible so the list stays stable.
 */
export async function syncLabDraftFromUpload(
  file: File,
  slot: "background" | "decal",
): Promise<LabStageAssetEntry> {
  const { mime, dataBase64 } = await readFileAsBase64(file);
  const preferredId = slot === "background" ? STAGE_BG_ASSET_ID : STAGE_DECAL_ASSET_ID;
  const existing = getLabStageAssetBySlot(slot) ?? assets.find((a) => a.id === preferredId);
  const objectUrl = `data:${mime};base64,${dataBase64}`;
  const kind: StageAssetKind = slot === "decal" ? "decal" : "image";

  if (existing) {
    assets = assets.map((a) => {
      if (a.id === existing.id) {
        return {
          ...a,
          label: file.name,
          mime,
          dataBase64,
          objectUrl,
          kind,
          gpuSlot: slot,
        };
      }
      if (a.gpuSlot === slot) return { ...a, gpuSlot: null };
      return a;
    });
    notify();
    return assets.find((a) => a.id === existing.id)!;
  }

  return addLabStageAsset({
    preferredId,
    kind,
    label: file.name,
    mime,
    dataBase64,
    objectUrl,
    gpuSlot: slot,
  });
}

/** Drop the draft entry currently bound to a GPU slot (UploadButton Remove). */
export function clearLabDraftGpuSlot(slot: "background" | "decal"): void {
  const bound = getLabStageAssetBySlot(slot);
  if (bound) {
    removeLabStageAsset(bound.id);
    return;
  }
  assets = assets.map((a) => (a.gpuSlot === slot ? { ...a, gpuSlot: null } : a));
  notify();
}
