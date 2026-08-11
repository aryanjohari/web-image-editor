/**
 * Shared thin HTTP helpers for Vercel-style Stage API handlers.
 */

export type VercelRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
};

export type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function methodNotAllowed(res: VercelResponse, allow: string): void {
  res.setHeader("Allow", allow);
  res.status(405).json({ error: "Method not allowed" });
}

export function queryParam(
  query: VercelRequest["query"],
  name: string,
): string | undefined {
  const raw = query?.[name];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return undefined;
}
