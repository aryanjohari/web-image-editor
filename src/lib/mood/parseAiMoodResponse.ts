import { getPresetById } from "@/data/presetCatalog";
import { validatePresetPatch, type PresetPatch } from "@/lib/preset/apply";
import { PresetValidationError } from "@/lib/preset/validate";
import type { AiMoodResponse } from "./types";

export type ParseAiMoodResult =
  | { ok: true; data: AiMoodResponse }
  | { ok: false; error: string };

const ALLOWED_TOP_LEVEL_KEYS = new Set(["basePresetId", "patch"]);

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function parseAiMoodResponse(raw: string): ParseAiMoodResult {
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

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      return { ok: false, error: `Unknown top-level key: ${key}` };
    }
  }

  const basePresetId = parsed.basePresetId;
  if (typeof basePresetId !== "string" || basePresetId.trim() === "") {
    return { ok: false, error: "basePresetId must be a non-empty string" };
  }

  if (!getPresetById(basePresetId)) {
    return { ok: false, error: `Unknown preset id: ${basePresetId}` };
  }

  const patch = parsed.patch;
  if (patch !== undefined) {
    if (!isRecord(patch)) {
      return { ok: false, error: "patch must be an object" };
    }
    try {
      validatePresetPatch(patch as PresetPatch);
    } catch (err) {
      const message =
        err instanceof PresetValidationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Invalid patch";
      return { ok: false, error: message };
    }
  }

  const data: AiMoodResponse = { basePresetId };
  if (patch !== undefined) {
    data.patch = patch as PresetPatch;
  }

  return { ok: true, data };
}
