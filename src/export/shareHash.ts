import { zlibSync, unzlibSync, strToU8, strFromU8 } from "fflate";
import type { Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";

/** Encoded `#r=` payload budget (mid of M04 8–16 KiB band). */
export const HASH_BUDGET_CHARS = 12 * 1024;

export class ShareHashError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ShareHashError";
    this.code = code;
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Encode recipe → `#r=<base64url(zlib(json))>` (recipe only). */
export function encodeRecipeHash(recipe: Recipe): string {
  const validated = validateRecipe(recipe);
  const json = JSON.stringify(validated);
  const compressed = zlibSync(strToU8(json), { level: 9 });
  const payload = toBase64Url(compressed);
  if (payload.length > HASH_BUDGET_CHARS) {
    throw new ShareHashError(
      "OVER_BUDGET",
      `share hash exceeds ${HASH_BUDGET_CHARS} chars (${payload.length}) — simplify recipe`,
    );
  }
  return `#r=${payload}`;
}

/** Decode `#r=…` or raw payload → validated Recipe. */
export function decodeRecipeHash(hashOrPayload: string): Recipe {
  let payload = hashOrPayload.trim();
  if (payload.startsWith("#")) payload = payload.slice(1);
  if (payload.startsWith("r=")) payload = payload.slice(2);
  if (!payload) {
    throw new ShareHashError("EMPTY", "share hash is empty");
  }
  if (payload.length > HASH_BUDGET_CHARS * 2) {
    throw new ShareHashError("OVER_BUDGET", "share hash payload too large");
  }
  try {
    const bytes = fromBase64Url(payload);
    const json = strFromU8(unzlibSync(bytes));
    return validateRecipe(JSON.parse(json));
  } catch (e) {
    if (e instanceof ShareHashError) throw e;
    throw new ShareHashError(
      "DECODE",
      e instanceof Error ? e.message : "failed to decode share hash",
    );
  }
}

export function tryDecodeLocationHash(hash = typeof window !== "undefined" ? window.location.hash : ""): {
  recipe: Recipe | null;
  error: string | null;
  present: boolean;
} {
  if (!hash || !hash.includes("r=")) {
    return { recipe: null, error: null, present: false };
  }
  try {
    return { recipe: decodeRecipeHash(hash), error: null, present: true };
  } catch (e) {
    return {
      recipe: null,
      error: e instanceof Error ? e.message : String(e),
      present: true,
    };
  }
}
