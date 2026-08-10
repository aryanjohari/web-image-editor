/**
 * Minimal structural checks for Stage Phase 0 contracts.
 * Full validation / zod can land with Phase 1 API — these guard shapes in tests.
 */

import { STAGE_RECIPE_SCHEMA_VERSION, type StageBrandKit, type StageJobRequest, type StageRecipe } from "./types";

export type StageParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseBrandKit(input: unknown): StageParseResult<StageBrandKit> {
  if (!isRecord(input)) return { ok: false, error: "brand kit must be an object" };
  if (typeof input.id !== "string" || !input.id.trim()) return { ok: false, error: "id is required" };
  if (typeof input.name !== "string" || !input.name.trim()) return { ok: false, error: "name is required" };
  if (!Array.isArray(input.colors)) return { ok: false, error: "colors must be an array" };
  if (!Array.isArray(input.fonts)) return { ok: false, error: "fonts must be an array" };
  return { ok: true, data: input as unknown as StageBrandKit };
}

export function parseStageRecipe(input: unknown): StageParseResult<StageRecipe> {
  if (!isRecord(input)) return { ok: false, error: "recipe must be an object" };
  if (input.recipeSchemaVersion !== STAGE_RECIPE_SCHEMA_VERSION) {
    return { ok: false, error: `recipeSchemaVersion must be ${STAGE_RECIPE_SCHEMA_VERSION}` };
  }
  if (typeof input.engineVersion !== "string") return { ok: false, error: "engineVersion is required" };
  if (!Array.isArray(input.layers)) return { ok: false, error: "layers must be an array" };
  if (!isRecord(input.assets)) return { ok: false, error: "assets must be an object" };
  if (!isRecord(input.viewport)) return { ok: false, error: "viewport is required" };
  if (typeof input.baseTimeSeconds !== "number") return { ok: false, error: "baseTimeSeconds is required" };
  return { ok: true, data: input as unknown as StageRecipe };
}

export function parseJobRequest(input: unknown): StageParseResult<StageJobRequest> {
  if (!isRecord(input)) return { ok: false, error: "job request must be an object" };
  if (typeof input.brandId !== "string" || !input.brandId.trim()) {
    return { ok: false, error: "brandId is required" };
  }
  if (typeof input.brief !== "string" || !input.brief.trim()) {
    return { ok: false, error: "brief is required" };
  }
  return { ok: true, data: input as unknown as StageJobRequest };
}
