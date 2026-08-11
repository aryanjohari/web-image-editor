import { afterEach, describe, expect, it } from "vitest";
import {
  appendJobArtifacts,
  createBrand,
  createJobRecord,
  getBrand,
  getJob,
  listBrands,
  patchBrand,
  resetStageStore,
  setJobSucceeded,
} from "./stageStore";

afterEach(() => {
  resetStageStore();
});

describe("stageStore", () => {
  it("creates and lists brands", () => {
    const b = createBrand({ name: "Acme", colors: [], fonts: [] });
    expect(b.id).toMatch(/^brand_/);
    expect(b.name).toBe("Acme");
    expect(listBrands()).toHaveLength(1);
    expect(getBrand(b.id)?.name).toBe("Acme");
  });

  it("patches brands", () => {
    const b = createBrand({ name: "Acme" });
    const next = patchBrand(b.id, { name: "Acme Co", voiceNotes: "calm" });
    expect(next?.name).toBe("Acme Co");
    expect(next?.voiceNotes).toBe("calm");
    expect(getBrand(b.id)?.name).toBe("Acme Co");
  });

  it("creates jobs and appends artifact metadata", () => {
    const brand = createBrand({ name: "B" });
    const job = createJobRecord({ brandId: brand.id, brief: "soft dusk" });
    expect(job.status).toBe("running");
    expect(getJob(job.id)?.id).toBe(job.id);

    const recipe = {
      recipeSchemaVersion: 3 as const,
      engineVersion: "0.0.0",
      layers: [],
      assets: {},
      viewport: {
        drawBufferWidth: 1920,
        drawBufferHeight: 1080,
        cssWidth: 1920,
        cssHeight: 1080,
        dpr: 1,
      },
      baseTimeSeconds: 0,
    };
    setJobSucceeded(job.id, recipe);
    expect(getJob(job.id)?.status).toBe("succeeded");

    const withArts = appendJobArtifacts(job.id, [
      { packProfileId: "square", kind: "png", url: "https://example.com/a.png" },
    ]);
    expect(withArts?.artifacts).toHaveLength(1);
  });

  it("reset clears maps", () => {
    createBrand({ name: "X" });
    resetStageStore();
    expect(listBrands()).toHaveLength(0);
  });
});
