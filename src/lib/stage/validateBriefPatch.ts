/**
 * Phase 2 — validate LLM brief patches (v2-compatible PresetPatch shape + optional baseLookId).
 * Rejects unknown / dangerous keys; clamps numeric fields against brand limits when present.
 */

import { getPresetById } from "../../data/presetCatalog";
import {
  validatePresetPatch,
  type PresetPatch,
} from "../preset/apply";
import { PresetValidationError } from "../preset/validate";
import type { StageBrandKit, StageBrandLimits } from "./types";

export type StageBriefPatchResult = {
  patch: PresetPatch;
  baseLookId?: string;
  summary?: string;
};

export type ParseStageBriefResult =
  | { ok: true; data: StageBriefPatchResult }
  | { ok: false; error: string };

const ALLOWED_TOP_LEVEL = new Set(["patch", "summary", "baseLookId", "basePresetId"]);

const ALLOWED_LAYER_EFFECT_KEYS = new Set([
  "meltIntensity",
  "colorBleed",
  "noiseLevel",
  "posterizeSteps",
  "timeScale",
  "maskCenterX",
  "maskCenterY",
  "maskRadius",
  "twirlIntensity",
  "colorA",
  "colorB",
  "duotoneBlend",
  "colorCycleSpeed",
  "halftoneIntensity",
  "scanlineIntensity",
]);

const ALLOWED_SYNTH_KEYS = new Set([
  "decalScale",
  "decalOffsetX",
  "decalOffsetY",
  "decalBackgroundLumaMask",
  "linkDecalToMath",
  "linkTextToMath",
  "textLayers",
  "selectedTextLayerId",
  "textLayerEffects",
]);

const ALLOWED_PATCH_KEYS = new Set(["layerEffects", "synth"]);

const ALLOWED_LAYER_IDS = new Set(["background", "decal", "text"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
): string | null {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      return `Unknown key: ${path ? `${path}.` : ""}${key}`;
    }
  }
  return null;
}

function assertAllowlistedPatch(patch: Record<string, unknown>): string | null {
  const topErr = rejectUnknownKeys(patch, ALLOWED_PATCH_KEYS, "patch");
  if (topErr) return topErr;

  if (patch.layerEffects !== undefined) {
    if (!isRecord(patch.layerEffects)) return "patch.layerEffects must be an object";
    const leErr = rejectUnknownKeys(patch.layerEffects, ALLOWED_LAYER_IDS, "patch.layerEffects");
    if (leErr) return leErr;
    for (const layerId of Object.keys(patch.layerEffects)) {
      const layer = patch.layerEffects[layerId];
      if (!isRecord(layer)) return `patch.layerEffects.${layerId} must be an object`;
      const fieldErr = rejectUnknownKeys(layer, ALLOWED_LAYER_EFFECT_KEYS, `patch.layerEffects.${layerId}`);
      if (fieldErr) return fieldErr;
    }
  }

  if (patch.synth !== undefined) {
    if (!isRecord(patch.synth)) return "patch.synth must be an object";
    const sErr = rejectUnknownKeys(patch.synth, ALLOWED_SYNTH_KEYS, "patch.synth");
    if (sErr) return sErr;
  }

  return null;
}

function clamp(n: number, max: number): number {
  return Math.min(n, max);
}

/**
 * Clamp intensity fields in a validated patch against brand limits (mutate-safe copy).
 */
export function clampPatchToBrandLimits(
  patch: PresetPatch,
  limits?: StageBrandLimits,
): PresetPatch {
  if (!limits || !patch.layerEffects) return patch;

  const nextLayers = { ...patch.layerEffects };
  for (const layerId of ["background", "decal", "text"] as const) {
    const layer = nextLayers[layerId];
    if (!layer) continue;
    const copy = { ...layer };
    if (limits.maxMeltIntensity !== undefined && copy.meltIntensity !== undefined) {
      copy.meltIntensity = clamp(copy.meltIntensity, limits.maxMeltIntensity);
    }
    if (limits.maxNoiseLevel !== undefined && copy.noiseLevel !== undefined) {
      copy.noiseLevel = clamp(copy.noiseLevel, limits.maxNoiseLevel);
    }
    if (limits.maxScanlineIntensity !== undefined && copy.scanlineIntensity !== undefined) {
      copy.scanlineIntensity = clamp(copy.scanlineIntensity, limits.maxScanlineIntensity);
    }
    nextLayers[layerId] = copy;
  }
  return { ...patch, layerEffects: nextLayers };
}

function resolveBaseLookId(
  parsed: Record<string, unknown>,
  allowedLookIds?: string[],
): { ok: true; id?: string } | { ok: false; error: string } {
  const raw =
    typeof parsed.baseLookId === "string"
      ? parsed.baseLookId
      : typeof parsed.basePresetId === "string"
        ? parsed.basePresetId
        : undefined;

  if (raw === undefined) return { ok: true, id: undefined };
  const id = raw.trim();
  if (!id) return { ok: false, error: "baseLookId must be a non-empty string when provided" };
  if (!getPresetById(id)) {
    return { ok: false, error: `Unknown look id: ${id}` };
  }
  if (allowedLookIds && allowedLookIds.length > 0 && !allowedLookIds.includes(id)) {
    return { ok: false, error: `Look id not allowed by brand: ${id}` };
  }
  return { ok: true, id };
}

/**
 * Parse model JSON into a validated Stage brief response.
 * Accepts `{ patch?, summary?, baseLookId? }` (also `basePresetId` alias).
 * Empty brand allowed — patch-only responses are valid when baseLookId omitted.
 */
export function parseStageBriefResponse(
  raw: string,
  options?: { brand?: StageBrandKit | null; requirePatchOrLook?: boolean },
): ParseStageBriefResult {
  const cleaned = stripMarkdownFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "Response must be a JSON object" };
  }

  const topErr = rejectUnknownKeys(parsed, ALLOWED_TOP_LEVEL, "");
  if (topErr) return { ok: false, error: topErr };

  const allowedLooks = options?.brand?.limits?.allowedLookIds;
  const look = resolveBaseLookId(parsed, allowedLooks);
  if (!look.ok) return { ok: false, error: look.error };

  let summary: string | undefined;
  if (parsed.summary !== undefined) {
    if (typeof parsed.summary !== "string") {
      return { ok: false, error: "summary must be a string" };
    }
    summary = parsed.summary.trim() || undefined;
  }

  let patch: PresetPatch | undefined;
  if (parsed.patch !== undefined) {
    if (!isRecord(parsed.patch)) {
      return { ok: false, error: "patch must be an object" };
    }
    const allowErr = assertAllowlistedPatch(parsed.patch);
    if (allowErr) return { ok: false, error: allowErr };
    try {
      validatePresetPatch(parsed.patch as PresetPatch);
    } catch (err) {
      const message =
        err instanceof PresetValidationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid patch";
      return { ok: false, error: message };
    }
    patch = clampPatchToBrandLimits(parsed.patch as PresetPatch, options?.brand?.limits);
  }

  if (options?.requirePatchOrLook !== false) {
    if (!look.id && !patch) {
      return { ok: false, error: "Response must include patch and/or baseLookId" };
    }
  }

  const data: StageBriefPatchResult = {
    patch: patch ?? {},
  };
  if (look.id) data.baseLookId = look.id;
  if (summary) data.summary = summary;
  return { ok: true, data };
}
