import { afterEach, describe, expect, it, vi } from "vitest";
import type { RunStageBriefResult } from "../runStageBrief";
import { createAndRunStageJob, patchStageJob } from "./runStageJob";
import { createBrand, getJob, resetStageStore } from "./stageStore";

afterEach(() => {
  resetStageStore();
  vi.restoreAllMocks();
});

function okBrief(overrides?: Partial<Extract<RunStageBriefResult, { ok: true }>["data"]>): RunStageBriefResult {
  return {
    ok: true,
    data: {
      patch: { layerEffects: { background: { meltIntensity: 0.42 } } },
      summary: "soft dusk",
      baseLookId: "soft-drift",
      ...overrides,
    },
  };
}

describe("runStageJob", () => {
  it("rejects missing brand", async () => {
    const result = await createAndRunStageJob(
      { brandId: "missing", brief: "hello" },
      { geminiApiKey: "fake", runBrief: async () => okBrief() },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("rejects bad request body", async () => {
    const result = await createAndRunStageJob(
      { brief: "only" },
      { geminiApiKey: "fake", runBrief: async () => okBrief() },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("creates succeeded job with recipe from mocked Gemini", async () => {
    const brand = createBrand({ name: "Demo" });
    const runBrief = vi.fn(async () => okBrief());
    const result = await createAndRunStageJob(
      { brandId: brand.id, brief: "soft dusk hero" },
      { geminiApiKey: "fake", runBrief },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.job.status).toBe("succeeded");
    expect(result.job.recipe?.brandId).toBe(brand.id);
    expect(result.job.recipe?.baseLookId).toBe("soft-drift");
    expect(result.job.recipe?.layers.length).toBeGreaterThan(0);
    expect(runBrief).toHaveBeenCalledOnce();
  });

  it("stores failed job when brief returns error", async () => {
    const brand = createBrand({ name: "Demo" });
    const result = await createAndRunStageJob(
      { brandId: brand.id, brief: "x" },
      {
        geminiApiKey: "fake",
        runBrief: async () => ({ ok: false, status: 422, error: "bad patch" }),
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.job.status).toBe("failed");
    expect(result.job.error).toBe("bad patch");
  });

  it("patches an existing job recipe", async () => {
    const brand = createBrand({ name: "Demo" });
    const created = await createAndRunStageJob(
      { brandId: brand.id, brief: "first" },
      { geminiApiKey: "fake", runBrief: async () => okBrief() },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const patched = await patchStageJob(
      created.job.id,
      "more grain",
      {
        geminiApiKey: "fake",
        runBrief: async () =>
          okBrief({
            summary: "grainier",
            patch: { layerEffects: { background: { noiseLevel: 0.2 } } },
          }),
      },
    );
    expect(patched.ok).toBe(true);
    if (!patched.ok) return;
    expect(patched.job.status).toBe("succeeded");
    expect(patched.job.recipe?.meta?.summary).toBe("grainier");
    expect(getJob(created.job.id)?.recipe?.meta?.summary).toBe("grainier");
  });
});
