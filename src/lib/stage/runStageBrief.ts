/**
 * Shared Gemini brief runner used by api/brief.ts (and thin mood adapter).
 * Safe for Vitest when generateContent is mocked.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PRESET_CATALOG } from "../../data/presetCatalog";
import { buildBriefSystemPrompt } from "./buildBriefSystemPrompt";
import type { StageBrandKit, StageRecipe } from "./types";
import { parseStageBriefResponse, type StageBriefPatchResult } from "./validateBriefPatch";

export type RunStageBriefInput = {
  brief: string;
  brand?: StageBrandKit | null;
  recipe?: StageRecipe | Partial<StageRecipe> | null;
  catalogLookIds?: string[];
  apiKey: string;
  model?: string;
};

export type RunStageBriefOk = {
  ok: true;
  data: StageBriefPatchResult;
};

export type RunStageBriefFail = {
  ok: false;
  status: 400 | 422 | 502;
  error: string;
};

export type RunStageBriefResult = RunStageBriefOk | RunStageBriefFail;

type EnvMap = Record<string, string | undefined>;

function readProcessEnv(): EnvMap {
  const g = globalThis as { process?: { env?: EnvMap } };
  return g.process?.env ?? {};
}

export function getGeminiApiKeyFromEnv(env: EnvMap = readProcessEnv()): string | undefined {
  return env.GEMINI_API_KEY || env.GOOGLE_API_KEY || undefined;
}

export function getGeminiModelFromEnv(env: EnvMap = readProcessEnv()): string {
  return env.GEMINI_MODEL || "gemini-2.5-flash";
}

function buildUserMessage(input: RunStageBriefInput): string {
  const parts = [`Brief:\n${input.brief.trim()}`];
  if (input.recipe) {
    try {
      // Strip bulky asset payloads — LLM only needs structure for conversational patches.
      const slim = structuredClone(input.recipe) as Record<string, unknown>;
      if (slim.assets && typeof slim.assets === "object") {
        const assets = slim.assets as Record<string, Record<string, unknown>>;
        for (const id of Object.keys(assets)) {
          const a = { ...assets[id] };
          delete a.dataBase64;
          if (typeof a.url === "string" && a.url.startsWith("data:")) delete a.url;
          assets[id] = a;
        }
      }
      parts.push(`Current recipe snapshot (JSON):\n${JSON.stringify(slim)}`);
    } catch {
      parts.push("Current recipe: (unavailable)");
    }
  }
  return parts.join("\n\n");
}

/**
 * Call Gemini and validate the JSON patch response.
 */
export async function runStageBrief(input: RunStageBriefInput): Promise<RunStageBriefResult> {
  const brief = input.brief?.trim() ?? "";
  if (!brief) {
    return { ok: false, status: 400, error: "brief is required" };
  }

  const modelName = input.model ?? getGeminiModelFromEnv();
  const system = buildBriefSystemPrompt({
    catalog: PRESET_CATALOG.map((e) => ({
      id: e.id,
      label: e.label,
      category: e.category,
      keywords: e.keywords,
      description: e.description,
    })),
    brand: input.brand,
    catalogLookIds: input.catalogLookIds,
  });

  let content: string;
  try {
    const genAI = new GoogleGenerativeAI(input.apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: system,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });
    const result = await model.generateContent(buildUserMessage(input));
    content = result.response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    return { ok: false, status: 502, error: message };
  }

  if (!content?.trim()) {
    return { ok: false, status: 502, error: "Empty response from Gemini" };
  }

  const parsed = parseStageBriefResponse(content, { brand: input.brand });
  if (!parsed.ok) {
    return { ok: false, status: 422, error: parsed.error };
  }

  return { ok: true, data: parsed.data };
}
