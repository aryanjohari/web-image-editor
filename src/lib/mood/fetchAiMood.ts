import type { AiMoodResponse } from "./types";

const MOOD_API_TIMEOUT_MS = 15_000;

export class AiMoodFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiMoodFetchError";
  }
}

export async function fetchAiMood(prompt: string): Promise<AiMoodResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MOOD_API_TIMEOUT_MS);

  try {
    const response = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new AiMoodFetchError("Invalid response from mood API");
    }

    if (!response.ok) {
      const error =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "string"
          ? (body as { error: string }).error
          : `Mood API failed (${response.status})`;
      throw new AiMoodFetchError(error);
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("basePresetId" in body) ||
      typeof (body as { basePresetId: unknown }).basePresetId !== "string"
    ) {
      throw new AiMoodFetchError("Invalid mood API payload");
    }

    const result = body as AiMoodResponse;
    return result.patch ? result : { basePresetId: result.basePresetId };
  } catch (err) {
    if (err instanceof AiMoodFetchError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AiMoodFetchError("Mood API timed out");
    }
    throw new AiMoodFetchError("Could not reach mood API");
  } finally {
    clearTimeout(timeout);
  }
}
