import { describe, expect, it } from "vitest";
import {
  buildPresetShareUrl,
  isValidCatalogPresetId,
  parsePresetIdFromSearchParams,
} from "@/lib/preset/presetShareUrl";

describe("parsePresetIdFromSearchParams", () => {
  it("returns preset id when present", () => {
    const params = new URLSearchParams("preset=glitch-core");
    expect(parsePresetIdFromSearchParams(params)).toBe("glitch-core");
  });

  it("returns null when absent or blank", () => {
    expect(parsePresetIdFromSearchParams(new URLSearchParams())).toBeNull();
    expect(parsePresetIdFromSearchParams(new URLSearchParams("preset="))).toBeNull();
    expect(parsePresetIdFromSearchParams(new URLSearchParams("preset=   "))).toBeNull();
  });
});

describe("isValidCatalogPresetId", () => {
  it("accepts known catalog ids", () => {
    expect(isValidCatalogPresetId("glitch-core")).toBe(true);
    expect(isValidCatalogPresetId("archive")).toBe(true);
    expect(isValidCatalogPresetId("soft-drift")).toBe(true);
  });

  it("rejects unknown ids", () => {
    expect(isValidCatalogPresetId("not-real")).toBe(false);
    expect(isValidCatalogPresetId("")).toBe(false);
  });
});

describe("buildPresetShareUrl", () => {
  it("builds lab share url with encoded preset param", () => {
    expect(buildPresetShareUrl("/lab", "glitch-core", "https://example.com")).toBe(
      "https://example.com/lab?preset=glitch-core",
    );
  });

  it("builds landing share url", () => {
    expect(buildPresetShareUrl("/", "acid-noir", "https://example.com")).toBe(
      "https://example.com/?preset=acid-noir",
    );
  });
});
