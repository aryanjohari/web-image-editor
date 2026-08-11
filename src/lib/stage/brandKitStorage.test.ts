import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STAGE_BRAND_KIT_STORAGE_KEY,
  brandKitHasRules,
  clearActiveBrandKit,
  createDefaultActiveBrandKit,
  loadActiveBrandKit,
  saveActiveBrandKit,
} from "@/lib/stage/brandKitStorage";
import type { StageBrandKit } from "@/lib/stage/types";

const memory = new Map<string, string>();

function mockLocalStorage() {
  memory.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, v);
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  memory.clear();
});

describe("brandKitStorage", () => {
  it("returns null when empty", () => {
    mockLocalStorage();
    expect(loadActiveBrandKit()).toBeNull();
  });

  it("round-trips save → load", () => {
    mockLocalStorage();
    const kit: StageBrandKit = {
      id: "b1",
      name: "Acme",
      colors: [{ id: "c1", hex: "#112233" }],
      fonts: [{ id: "f1", family: "Fraunces" }],
      voiceNotes: "calm",
      limits: { allowedLookIds: ["soft-drift"], maxMeltIntensity: 0.4 },
    };
    const saved = saveActiveBrandKit(kit);
    expect(saved.name).toBe("Acme");
    expect(saved.updatedAt).toBeTruthy();
    const loaded = loadActiveBrandKit();
    expect(loaded?.name).toBe("Acme");
    expect(loaded?.colors[0]?.hex).toBe("#112233");
    expect(loaded?.limits?.allowedLookIds).toEqual(["soft-drift"]);
    expect(memory.get(STAGE_BRAND_KIT_STORAGE_KEY)).toBeTruthy();
  });

  it("clear removes kit", () => {
    mockLocalStorage();
    saveActiveBrandKit({ id: "x", name: "X", colors: [], fonts: [] });
    clearActiveBrandKit();
    expect(loadActiveBrandKit()).toBeNull();
  });

  it("rejects corrupt JSON via parse", () => {
    mockLocalStorage();
    memory.set(STAGE_BRAND_KIT_STORAGE_KEY, "{not-json");
    expect(loadActiveBrandKit()).toBeNull();
  });

  it("brandKitHasRules detects empty vs ruled kits", () => {
    expect(brandKitHasRules(createDefaultActiveBrandKit())).toBe(false);
    expect(
      brandKitHasRules({
        id: "a",
        name: "Brand",
        colors: [{ id: "c1", hex: "#000000" }],
        fonts: [],
      }),
    ).toBe(true);
  });
});
