/**
 * In-memory Stage API store (Phase 4 dogfood).
 *
 * Lives in one serverless isolate's module scope. Cold starts and redeploys
 * wipe all brands and jobs — there is no durable persistence.
 */

import { createEmptyBrandKit } from "../index";
import type {
  StageBrandKit,
  StageExportArtifact,
  StageJob,
  StageJobRequest,
  StageRecipe,
} from "../types";

export type BrandKitCreateInput = {
  name: string;
  voiceNotes?: string;
  colors?: StageBrandKit["colors"];
  fonts?: StageBrandKit["fonts"];
  logoAssetId?: string;
  limits?: StageBrandKit["limits"];
};

export type BrandKitPatchInput = Partial<
  Pick<StageBrandKit, "name" | "voiceNotes" | "colors" | "fonts" | "logoAssetId" | "limits">
>;

const brands = new Map<string, StageBrandKit>();
const jobs = new Map<string, StageJob>();

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

/** Test / cold-start helper — clears both maps. */
export function resetStageStore(): void {
  brands.clear();
  jobs.clear();
}

export function createBrand(input: BrandKitCreateInput): StageBrandKit {
  const ts = nowIso();
  const brand = createEmptyBrandKit({
    id: newId("brand"),
    name: input.name.trim(),
    voiceNotes: input.voiceNotes,
    colors: input.colors ?? [],
    fonts: input.fonts ?? [],
    logoAssetId: input.logoAssetId,
    limits: input.limits,
    createdAt: ts,
    updatedAt: ts,
  });
  brands.set(brand.id, brand);
  return brand;
}

export function listBrands(): StageBrandKit[] {
  return Array.from(brands.values());
}

export function getBrand(id: string): StageBrandKit | undefined {
  return brands.get(id);
}

export function patchBrand(id: string, patch: BrandKitPatchInput): StageBrandKit | undefined {
  const existing = brands.get(id);
  if (!existing) return undefined;
  const next: StageBrandKit = {
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.voiceNotes !== undefined ? { voiceNotes: patch.voiceNotes } : {}),
    ...(patch.colors !== undefined ? { colors: patch.colors } : {}),
    ...(patch.fonts !== undefined ? { fonts: patch.fonts } : {}),
    ...(patch.logoAssetId !== undefined ? { logoAssetId: patch.logoAssetId } : {}),
    ...(patch.limits !== undefined ? { limits: patch.limits } : {}),
    updatedAt: nowIso(),
  };
  brands.set(id, next);
  return next;
}

export function createJobRecord(request: StageJobRequest): StageJob {
  const ts = nowIso();
  const job: StageJob = {
    id: newId("job"),
    status: "running",
    request,
    artifacts: [],
    createdAt: ts,
    updatedAt: ts,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): StageJob | undefined {
  return jobs.get(id);
}

export function updateJob(
  id: string,
  update: Partial<Pick<StageJob, "status" | "recipe" | "artifacts" | "error">>,
): StageJob | undefined {
  const existing = jobs.get(id);
  if (!existing) return undefined;
  const next: StageJob = {
    ...existing,
    ...update,
    updatedAt: nowIso(),
  };
  jobs.set(id, next);
  return next;
}

export function setJobSucceeded(id: string, recipe: StageRecipe): StageJob | undefined {
  return updateJob(id, { status: "succeeded", recipe, error: undefined });
}

export function setJobFailed(id: string, error: string): StageJob | undefined {
  return updateJob(id, { status: "failed", error });
}

export function appendJobArtifacts(
  id: string,
  artifacts: StageExportArtifact[],
): StageJob | undefined {
  const existing = jobs.get(id);
  if (!existing) return undefined;
  const merged = [...(existing.artifacts ?? []), ...artifacts];
  return updateJob(id, { artifacts: merged });
}
