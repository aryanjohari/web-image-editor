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

/**
 * POST /api/brief — Stage Phase 2 constrained LLM (Gemini).
 * Body: { brief, brand?, recipe?, catalogLookIds? }
 * 200: { patch, summary?, baseLookId? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getGeminiApiKeyFromEnv();
  if (!apiKey) {
    return res.status(503).json({ error: "Stage brief AI is not configured (set GEMINI_API_KEY or GOOGLE_API_KEY)" });
  }

  const body = isRecord(req.body) ? req.body : {};
  const brief =
    typeof body.brief === "string"
      ? body.brief
      : typeof body.prompt === "string"
        ? body.prompt
        : "";

  const brand = (body.brand as StageBrandKit | null | undefined) ?? null;
  const recipe = (body.recipe as StageRecipe | null | undefined) ?? null;
  const catalogLookIds = Array.isArray(body.catalogLookIds)
    ? body.catalogLookIds.filter((id): id is string => typeof id === "string")
    : undefined;

  const result = await runStageBrief({
    brief,
    brand,
    recipe,
    catalogLookIds,
    apiKey,
    model: getGeminiModelFromEnv(),
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  const { patch, summary, baseLookId } = result.data;
  const payload: Record<string, unknown> = { patch };
  if (summary) payload.summary = summary;
  if (baseLookId) payload.baseLookId = baseLookId;
  return res.status(200).json(payload);
}
