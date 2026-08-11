import { describe, expect, it } from "vitest";
import { PRESET_CATALOG } from "@/data/presetCatalog";
import { buildBriefSystemPrompt } from "@/lib/stage/buildBriefSystemPrompt";
import type { StageBrandKit } from "@/lib/stage/types";

const catalog = PRESET_CATALOG.map((e) => ({
  id: e.id,
  label: e.label,
  category: e.category,
  keywords: e.keywords,
  description: e.description,
}));

describe("buildBriefSystemPrompt", () => {
  it("includes brand limits and allowed looks", () => {
    const brand: StageBrandKit = {
      id: "b1",
      name: "Northwind",
      voiceNotes: "editorial calm",
      colors: [{ id: "primary", hex: "#0a1a2a", role: "primary" }],
      fonts: [{ id: "display", family: "Fraunces", role: "display" }],
      limits: {
        allowedLookIds: ["soft-drift", "film-grain"],
        maxMeltIntensity: 0.35,
        maxNoiseLevel: 0.15,
      },
    };

    const prompt = buildBriefSystemPrompt({ catalog, brand });
    expect(prompt).toContain("Northwind");
    expect(prompt).toContain("editorial calm");
    expect(prompt).toContain("#0a1a2a");
    expect(prompt).toContain("Fraunces");
    expect(prompt).toContain("maxMeltIntensity: 0.35");
    expect(prompt).toContain("maxNoiseLevel: 0.15");
    expect(prompt).toContain("soft-drift");
    expect(prompt).toContain("film-grain");
    expect(prompt).not.toContain('id: "glitch-core"');
    expect(prompt).toContain("Output JSON only");
    expect(prompt).toContain("NEVER invent new asset image bytes");
  });

  it("documents weaker constitution when no brand", () => {
    const prompt = buildBriefSystemPrompt({ catalog, brand: null });
    expect(prompt).toContain("BRAND: none saved");
  });
});
