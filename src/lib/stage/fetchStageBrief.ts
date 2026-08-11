/**
 * Phase 2 — client fetch for POST /api/brief (Gemini).
 */

import type { StageBrandKit, StageRecipe } from "./types";
import type { StageBriefPatchResult } from "./validateBriefPatch";
import { parseStageBriefResponse } from "./validateBriefPatch";

const BRIEF_API_TIMEOUT_MS = 20_000;

export class StageBriefFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "StageBriefFetchError";
    this.status = status;
  }
}

export type StageBriefRequestBody = {
  brief: string;
  brand?: StageBrandKit | null;
  recipe?: StageRecipe | Partial<StageRecipe> | null;
  catalogLookIds?: string[];
};

export async function fetchStageBrief(
  body: StageBriefRequestBody,
  brandForValidation?: StageBrandKit | null,
): Promise<StageBriefPatchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BRIEF_API_TIMEOUT_MS);

  try {
    const response = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brief: body.brief,
        brand: body.brand ?? undefined,
        recipe: body.recipe ?? undefined,
        catalogLookIds: body.catalogLookIds,
      }),
      signal: controller.signal,
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new StageBriefFetchError("Invalid response from brief API", response.status);
    }

    if (!response.ok) {
      const error =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : `Brief API failed (${response.status})`;
      throw new StageBriefFetchError(error, response.status);
    }

    const parsed = parseStageBriefResponse(JSON.stringify(payload), {
      brand: brandForValidation ?? body.brand,
    });
    if (!parsed.ok) {
      throw new StageBriefFetchError(parsed.error, 422);
    }
    return parsed.data;
  } catch (err) {
    if (err instanceof StageBriefFetchError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new StageBriefFetchError("Brief API timed out");
    }
    throw new StageBriefFetchError("Could not reach brief API");
  } finally {
    clearTimeout(timeout);
  }
}
