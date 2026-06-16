import { describe, expect, it } from "vitest";
import { PRESET_CATALOG } from "@/data/presetCatalog";
import { buildAiMoodSystemPrompt } from "@/lib/mood/buildAiMoodSystemPrompt";

describe("buildAiMoodSystemPrompt", () => {
  it("includes all catalog preset ids", () => {
    const prompt = buildAiMoodSystemPrompt();
    for (const entry of PRESET_CATALOG) {
      expect(prompt).toContain(`id: "${entry.id}"`);
    }
  });

  it("forbids images and URLs in output rules", () => {
    const prompt = buildAiMoodSystemPrompt();
    expect(prompt.toLowerCase()).toContain("never include image urls");
    expect(prompt.toLowerCase()).toContain("base64");
    expect(prompt.toLowerCase()).toContain("json only");
  });
});
