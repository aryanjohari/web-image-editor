import type { JsonValue, PathPatch, Recipe } from "./types";
import { RecipeValidationError, validateRecipe } from "./validate";

/**
 * Allowlisted JSON Pointer prefixes for PathPatch (M01 R9).
 * Paths may use numeric array index or object id after /objects/.
 */
const ALLOWLIST: RegExp[] = [
  /^\/packId$/,
  /^\/packVersion$/,
  /^\/meta\/(title|notes|createdAt)$/,
  /^\/canvas\/(width|height|background)$/,
  /^\/objects\/([^/]+)\/(opacity|blend|visible|z)$/,
  /^\/objects\/([^/]+)\/transform\/(x|y|scaleX|scaleY|rotation)$/,
  /^\/objects\/([^/]+)\/crop\/(x|y|width|height|fit)$/,
  /^\/objects\/([^/]+)\/source$/,
  /^\/objects\/([^/]+)\/text\/(content|fontFamily|fontWeight|fontSize|letterSpacing|lineHeight|color|align)$/,
  /^\/objects\/([^/]+)\/effects\/(\d+)\/params\/([A-Za-z0-9_]+)$/,
  /^\/objects\/([^/]+)\/maskRef$/,
  /^\/objects\/([^/]+)\/regional\/(subject|background)\/effects\/(\d+)\/params\/([A-Za-z0-9_]+)$/,
];

export class PathPatchError extends Error {
  readonly code: string;
  readonly path: string;

  constructor(code: string, path: string, message: string) {
    super(message);
    this.name = "PathPatchError";
    this.code = code;
    this.path = path;
  }
}

function isAllowlisted(path: string): boolean {
  return ALLOWLIST.some((re) => re.test(path));
}

function decodePointerToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function parsePointer(path: string): string[] {
  if (path === "") return [];
  if (!path.startsWith("/")) {
    throw new PathPatchError("POINTER", path, "JSON Pointer must start with /");
  }
  return path
    .slice(1)
    .split("/")
    .map(decodePointerToken);
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function resolveObjectContainer(
  recipe: Recipe,
  token: string,
): { parent: Recipe["objects"]; key: number } {
  const byIndex = /^(\d+)$/.exec(token);
  if (byIndex) {
    const idx = Number(byIndex[1]);
    if (idx < 0 || idx >= recipe.objects.length) {
      throw new PathPatchError("OOB", `/objects/${token}`, `object index ${idx} out of bounds`);
    }
    return { parent: recipe.objects, key: idx };
  }
  const idx = recipe.objects.findIndex((o) => o.id === token);
  if (idx < 0) {
    throw new PathPatchError("NOT_FOUND", `/objects/${token}`, `no object with id "${token}"`);
  }
  return { parent: recipe.objects, key: idx };
}

function setAtPointer(root: Recipe, path: string, value: JsonValue): void {
  const tokens = parsePointer(path);
  if (tokens.length === 0) {
    throw new PathPatchError("ROOT", path, "cannot replace entire recipe via PathPatch");
  }

  // Special-case /objects/{id|index}/...
  if (tokens[0] === "objects" && tokens.length >= 2) {
    const { parent, key } = resolveObjectContainer(root, tokens[1]!);
    let cursor: unknown = parent[key];
    const rest = tokens.slice(2);
    if (rest.length === 0) {
      throw new PathPatchError("FORBIDDEN", path, "cannot replace whole object via PathPatch");
    }
    for (let i = 0; i < rest.length - 1; i++) {
      const t = rest[i]!;
      if (cursor === null || typeof cursor !== "object") {
        throw new PathPatchError("PATH", path, `cannot walk into non-object at ${t}`);
      }
      const rec = cursor as Record<string, unknown>;
      if (!(t in rec)) {
        if (
          t === "params" ||
          t === "regional" ||
          t === "effects" ||
          t === "subject" ||
          t === "background" ||
          /^\d+$/.test(t)
        ) {
          const next = rest[i + 1] ?? "";
          if (t === "regional") {
            rec[t] = { subject: { effects: [] }, background: { effects: [] } };
          } else if (t === "subject" || t === "background") {
            rec[t] = { effects: [] };
          } else if (t === "effects") {
            rec[t] = [];
          } else {
            rec[t] = /^\d+$/.test(next) ? [] : {};
          }
        } else {
          throw new PathPatchError("PATH", path, `missing segment "${t}"`);
        }
      }
      cursor = (cursor as Record<string, unknown>)[t];
    }
    const last = rest[rest.length - 1]!;
    if (cursor === null || typeof cursor !== "object") {
      throw new PathPatchError("PATH", path, "cannot set on non-object parent");
    }
    if (Array.isArray(cursor)) {
      const idx = Number(last);
      if (!Number.isInteger(idx) || idx < 0 || idx >= cursor.length) {
        throw new PathPatchError("OOB", path, `array index ${last} out of bounds`);
      }
      cursor[idx] = value;
    } else {
      (cursor as Record<string, unknown>)[last] = value;
    }
    return;
  }

  // Root-level fields
  let cursor: unknown = root;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i]!;
    if (cursor === null || typeof cursor !== "object") {
      throw new PathPatchError("PATH", path, `cannot walk into non-object at ${t}`);
    }
    const rec = cursor as Record<string, unknown>;
    if (!(t in rec) || rec[t] === undefined) {
      rec[t] = {};
    }
    cursor = rec[t];
  }
  const last = tokens[tokens.length - 1]!;
  if (cursor === null || typeof cursor !== "object" || Array.isArray(cursor)) {
    throw new PathPatchError("PATH", path, "cannot set on invalid parent");
  }
  (cursor as Record<string, unknown>)[last] = value;
}

/**
 * Apply PathPatch onto a copy of `recipe`, then validateRecipe.
 * On failure: discard candidate; throw (caller keeps prior recipe).
 */
export function applyPathPatch(recipe: Recipe, patch: PathPatch): Recipe {
  if (!Array.isArray(patch)) {
    throw new PathPatchError("TYPE", "", "PathPatch must be an array");
  }

  const candidate = deepClone(recipe);

  for (let i = 0; i < patch.length; i++) {
    const op = patch[i];
    if (!op || typeof op !== "object" || Array.isArray(op)) {
      throw new PathPatchError("TYPE", `[${i}]`, "each op must be { path, value }");
    }
    const path = (op as { path?: unknown }).path;
    const value = (op as { value?: unknown }).value;
    if (typeof path !== "string") {
      throw new PathPatchError("TYPE", `[${i}].path`, "path must be a string");
    }
    if (!isAllowlisted(path)) {
      throw new PathPatchError(
        "ALLOWLIST",
        path,
        `path not allowlisted: ${path}`,
      );
    }
    if (value === undefined) {
      throw new PathPatchError("TYPE", path, "value must be present (use null only if schema allows)");
    }
    setAtPointer(candidate, path, value as JsonValue);
  }

  try {
    return validateRecipe(candidate);
  } catch (e) {
    if (e instanceof RecipeValidationError) {
      throw new PathPatchError(
        e.code,
        e.path || "(validate)",
        `post-merge validation failed: ${e.message}`,
      );
    }
    throw e;
  }
}

export function tryApplyPathPatch(
  recipe: Recipe,
  patch: PathPatch,
): { ok: true; recipe: Recipe } | { ok: false; error: PathPatchError } {
  try {
    return { ok: true, recipe: applyPathPatch(recipe, patch) };
  } catch (e) {
    if (e instanceof PathPatchError) {
      return { ok: false, error: e };
    }
    throw e;
  }
}
