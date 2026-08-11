/**
 * Legacy mood endpoint — now powered by Gemini Stage brief (OpenAI removed).
 * Accepts { prompt } or { brief, brand?, ... }; returns { basePresetId, patch? }
 * for landing MoodInput compatibility. Prefer POST /api/brief for Stage lab.
 */

import {
  getGeminiApiKeyFromEnv,
  getGeminiModelFromEnv,
  runStageBrief,
} from "../src/lib/stage/runStageBrief";
import type { StageBrandKit, StageRecipe } from "../src/lib/stage/types";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getGeminiApiKeyFromEnv();
  if (!apiKey) {
    return res.status(503).json({ error: "AI mood is not configured (set GEMINI_API_KEY or GOOGLE_API_KEY)" });
  }

  const body = isRecord(req.body) ? req.body : {};
  const brief =
    typeof body.brief === "string"
      ? body.brief.trim()
      : typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

  if (!brief) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const brand = (body.brand as StageBrandKit | null | undefined) ?? null;
  const recipe = (body.recipe as StageRecipe | null | undefined) ?? null;

  const result = await runStageBrief({
    brief,
    brand,
    recipe,
    apiKey,
    model: getGeminiModelFromEnv(),
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  const { patch, baseLookId } = result.data;
  if (!baseLookId) {
    // Landing mood always expects a base preset; keyword fallback on client if empty.
    // Prefer soft-drift when model only returned a patch.
    const basePresetId = "soft-drift";
    const payload: Record<string, unknown> = { basePresetId };
    if (patch && Object.keys(patch).length > 0) payload.patch = patch;
    return res.status(200).json(payload);
  }

  const payload: Record<string, unknown> = { basePresetId: baseLookId };
  if (patch && Object.keys(patch).length > 0) payload.patch = patch;
  return res.status(200).json(payload);
}
