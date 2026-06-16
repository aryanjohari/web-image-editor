import { buildAiMoodSystemPrompt } from "../src/lib/mood/buildAiMoodSystemPrompt";
import { parseAiMoodResponse } from "../src/lib/mood/parseAiMoodResponse";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI mood is not configured" });
  }

  const body = req.body as { prompt?: unknown } | undefined;
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildAiMoodSystemPrompt() },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
  } catch {
    return res.status(502).json({ error: "Failed to reach OpenAI" });
  }

  let data: ChatCompletionResponse;
  try {
    data = (await upstream.json()) as ChatCompletionResponse;
  } catch {
    return res.status(502).json({ error: "Invalid response from OpenAI" });
  }

  if (!upstream.ok) {
    return res.status(502).json({
      error: data.error?.message ?? "OpenAI request failed",
    });
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return res.status(502).json({ error: "Empty response from OpenAI" });
  }

  const parsed = parseAiMoodResponse(content);
  if (!parsed.ok) {
    return res.status(422).json({ error: parsed.error });
  }

  const { basePresetId, patch } = parsed.data;
  return res.status(200).json(patch ? { basePresetId, patch } : { basePresetId });
}
