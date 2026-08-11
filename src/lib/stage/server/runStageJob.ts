/**
 * Phase 4 — assemble StageJob recipes via Gemini brief + catalog look + patch.
 */

import { getPresetById, PRESET_CATALOG } from "../../../data/presetCatalog";
import { synthPresetV2ToStageRecipe } from "../adaptPreset";
import { parseJobRequest } from "../parse";
import {
  getGeminiApiKeyFromEnv,
  getGeminiModelFromEnv,
  runStageBrief,
  type RunStageBriefResult,
} from "../runStageBrief";
import type { StageJob, StageJobRequest, StageRecipe } from "../types";
import { mergePresetPatchIntoV2 } from "./mergePresetPatch";
import {
  createJobRecord,
  getBrand,
  getJob,
  setJobFailed,
  setJobSucceeded,
  updateJob,
} from "./stageStore";

export type RunStageBriefFn = typeof runStageBrief;

const DEFAULT_LOOK_ID = "soft-drift";

function resolveBaseLookId(
  request: StageJobRequest,
  llmLookId: string | undefined,
): string {
  if (request.options?.baseLookId) {
    const fromOpts = getPresetById(request.options.baseLookId);
    if (fromOpts) return fromOpts.id;
  }
  if (llmLookId) {
    const fromLlm = getPresetById(llmLookId);
    if (fromLlm) return fromLlm.id;
  }
  const featured = PRESET_CATALOG.find((e) => e.category === "featured");
  return featured?.id ?? PRESET_CATALOG[0]?.id ?? DEFAULT_LOOK_ID;
}

function buildRecipeFromBrief(
  brandId: string,
  baseLookId: string,
  patch: Parameters<typeof mergePresetPatchIntoV2>[1],
  summary: string | undefined,
): StageRecipe {
  const entry = getPresetById(baseLookId);
  if (!entry) {
    throw new Error(`Unknown base look: ${baseLookId}`);
  }
  const merged = mergePresetPatchIntoV2(entry.preset, patch ?? {});
  const recipe = synthPresetV2ToStageRecipe(merged);
  recipe.brandId = brandId;
  recipe.baseLookId = baseLookId;
  recipe.meta = {
    ...(recipe.meta ?? {}),
    ...(summary ? { summary } : {}),
    source: "stage-job",
  };
  return recipe;
}

export type CreateStageJobResult =
  | { ok: true; job: StageJob }
  | { ok: false; status: number; error: string };

export type CreateStageJobDeps = {
  runBrief?: RunStageBriefFn;
  geminiApiKey?: string;
  geminiModel?: string;
};

/** Create job, run Gemini, store succeeded job with recipe (or failed). */
export async function createAndRunStageJob(
  body: unknown,
  deps: CreateStageJobDeps = {},
): Promise<CreateStageJobResult> {
  const parsed = parseJobRequest(body);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error };
  }
  const request = parsed.data;

  const brand = getBrand(request.brandId);
  if (!brand) {
    return { ok: false, status: 404, error: `Brand not found: ${request.brandId}` };
  }

  const apiKey = deps.geminiApiKey ?? getGeminiApiKeyFromEnv();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "Stage brief AI is not configured (set GEMINI_API_KEY or GOOGLE_API_KEY)",
    };
  }

  let recipeContext: StageRecipe | null = null;
  if (request.baseRecipeId) {
    const baseJob = getJob(request.baseRecipeId);
    if (baseJob?.recipe) recipeContext = baseJob.recipe;
  }

  const job = createJobRecord(request);
  const runBrief = deps.runBrief ?? runStageBrief;

  let briefResult: RunStageBriefResult;
  try {
    briefResult = await runBrief({
      brief: request.brief,
      brand,
      recipe: recipeContext,
      catalogLookIds: request.options?.baseLookId ? [request.options.baseLookId] : undefined,
      apiKey,
      model: deps.geminiModel ?? getGeminiModelFromEnv(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Brief runner failed";
    const failed = setJobFailed(job.id, message);
    return { ok: true, job: failed ?? { ...job, status: "failed", error: message } };
  }

  if (!briefResult.ok) {
    const failed = setJobFailed(job.id, briefResult.error);
    return {
      ok: true,
      job: failed ?? { ...job, status: "failed", error: briefResult.error },
    };
  }

  try {
    const { patch, summary, baseLookId } = briefResult.data;
    const lookId = resolveBaseLookId(request, baseLookId);
    const recipe = buildRecipeFromBrief(brand.id, lookId, patch, summary);
    const succeeded = setJobSucceeded(job.id, recipe);
    return { ok: true, job: succeeded! };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build recipe";
    const failed = setJobFailed(job.id, message);
    return { ok: true, job: failed ?? { ...job, status: "failed", error: message } };
  }
}

export type PatchStageJobResult =
  | { ok: true; job: StageJob }
  | { ok: false; status: number; error: string };

/** Conversational follow-up: patch job recipe from a new message. */
export async function patchStageJob(
  jobId: string,
  message: string,
  deps: CreateStageJobDeps = {},
): Promise<PatchStageJobResult> {
  const brief = message?.trim() ?? "";
  if (!brief) {
    return { ok: false, status: 400, error: "message is required" };
  }

  const job = getJob(jobId);
  if (!job) {
    return { ok: false, status: 404, error: "Job not found" };
  }

  const brand = getBrand(job.request.brandId);
  if (!brand) {
    return { ok: false, status: 404, error: `Brand not found: ${job.request.brandId}` };
  }

  const apiKey = deps.geminiApiKey ?? getGeminiApiKeyFromEnv();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "Stage brief AI is not configured (set GEMINI_API_KEY or GOOGLE_API_KEY)",
    };
  }

  updateJob(jobId, { status: "running", error: undefined });

  const runBrief = deps.runBrief ?? runStageBrief;
  let briefResult: RunStageBriefResult;
  try {
    briefResult = await runBrief({
      brief,
      brand,
      recipe: job.recipe ?? null,
      apiKey,
      model: deps.geminiModel ?? getGeminiModelFromEnv(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Brief runner failed";
    const failed = setJobFailed(jobId, msg);
    return { ok: true, job: failed ?? { ...job, status: "failed", error: msg } };
  }

  if (!briefResult.ok) {
    const failed = setJobFailed(jobId, briefResult.error);
    return {
      ok: true,
      job: failed ?? { ...job, status: "failed", error: briefResult.error },
    };
  }

  try {
    const { patch, summary, baseLookId } = briefResult.data;
    const lookId = resolveBaseLookId(
      { ...job.request, options: { ...job.request.options, baseLookId: job.recipe?.baseLookId } },
      baseLookId ?? job.recipe?.baseLookId,
    );
    const recipe = buildRecipeFromBrief(brand.id, lookId, patch, summary);
    const succeeded = setJobSucceeded(jobId, recipe);
    return { ok: true, job: succeeded! };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to build recipe";
    const failed = setJobFailed(jobId, msg);
    return { ok: true, job: failed ?? { ...job, status: "failed", error: msg } };
  }
}
