import { TIER_A_EFFECTS, isKnownEffectId } from "../recipe/effectsRegistry";
import type { BlendMode, Effect } from "../recipe/types";
import editorialBw from "./editorial-bw.json";
import posterPunch from "./poster-punch.json";
import type { Pack, PackId, PackOverlayDefaults } from "./types";
import warmFilm from "./warm-film.json";

export class PackError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PackError";
    this.code = code;
  }
}

const BLENDS = new Set(["normal", "multiply", "screen", "overlay"]);

function expectString(v: unknown, path: string): string {
  if (typeof v !== "string" || !v) {
    throw new PackError("TYPE", `${path} must be a non-empty string`);
  }
  return v;
}

function expectNumber(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new PackError("TYPE", `${path} must be a finite number`);
  }
  return v;
}

function validateEffect(raw: unknown, path: string): Effect {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PackError("TYPE", `${path} must be an object`);
  }
  const rec = raw as Record<string, unknown>;
  const id = expectString(rec.id, `${path}.id`);
  if (!isKnownEffectId(id)) {
    throw new PackError("UNKNOWN_EFFECT", `${path}: unknown effect id "${id}"`);
  }
  const spec = TIER_A_EFFECTS[id]!;
  if (!spec.kinds.includes("image") || (spec.roles && !spec.roles.includes("main"))) {
    throw new PackError("ROLE", `${path}: effect "${id}" not admissible on main`);
  }
  if (rec.params === null || typeof rec.params !== "object" || Array.isArray(rec.params)) {
    throw new PackError("TYPE", `${path}.params must be an object`);
  }
  const paramsRaw = rec.params as Record<string, unknown>;
  const params: Effect["params"] = {};
  for (const key of Object.keys(paramsRaw)) {
    if (!(key in spec.params)) {
      throw new PackError("EXTRA_PARAM", `${path}.params.${key}: not in registry`);
    }
  }
  for (const [key, pspec] of Object.entries(spec.params)) {
    if (!(key in paramsRaw)) {
      if (pspec.optional) continue;
      throw new PackError("MISSING_PARAM", `${path}.params.${key}: required`);
    }
    const val = paramsRaw[key];
    if (pspec.type === "number") {
      const n = expectNumber(val, `${path}.params.${key}`);
      if (n < pspec.min || n > pspec.max) {
        throw new PackError(
          "OOR",
          `${path}.params.${key} out of range [${pspec.min}, ${pspec.max}]`,
        );
      }
      params[key] = n;
    } else if (pspec.type === "string") {
      params[key] = expectString(val, `${path}.params.${key}`);
    } else {
      if (typeof val !== "boolean") {
        throw new PackError("TYPE", `${path}.params.${key} must be boolean`);
      }
      params[key] = val;
    }
  }
  return { id, params };
}

function validateOverlay(raw: unknown, path: string): PackOverlayDefaults | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PackError("TYPE", `${path} must be an object`);
  }
  const rec = raw as Record<string, unknown>;
  const out: PackOverlayDefaults = {};
  if ("opacity" in rec) {
    const n = expectNumber(rec.opacity, `${path}.opacity`);
    if (n < 0 || n > 1) {
      throw new PackError("OOR", `${path}.opacity out of range [0, 1]`);
    }
    out.opacity = n;
  }
  if ("blend" in rec) {
    const b = expectString(rec.blend, `${path}.blend`);
    if (!BLENDS.has(b)) {
      throw new PackError("BLEND", `${path}.blend invalid`);
    }
    out.blend = b as BlendMode;
  }
  return out;
}

export function validatePack(raw: unknown): Pack {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PackError("TYPE", "pack must be an object");
  }
  const rec = raw as Record<string, unknown>;
  const id = expectString(rec.id, "id");
  const version = expectString(rec.version, "version");
  const label = expectString(rec.label, "label");
  const summary =
    rec.summary === undefined ? undefined : expectString(rec.summary, "summary");
  if (!Array.isArray(rec.axes)) {
    throw new PackError("TYPE", "axes must be an array");
  }
  const axes = rec.axes.map((a, i) => expectString(a, `axes[${i}]`));
  if (!Array.isArray(rec.mainEffects)) {
    throw new PackError("TYPE", "mainEffects must be an array");
  }
  const mainEffects = rec.mainEffects.map((e, i) => validateEffect(e, `mainEffects[${i}]`));
  const overlay = validateOverlay(rec.overlay, "overlay");
  return { id, version, label, summary, axes, mainEffects, overlay };
}

const RAW_PACKS: unknown[] = [editorialBw, warmFilm, posterPunch];

const CATALOG: Map<string, Pack> = new Map();
for (const raw of RAW_PACKS) {
  const pack = validatePack(raw);
  if (CATALOG.has(pack.id)) {
    throw new PackError("DUP", `duplicate pack id "${pack.id}"`);
  }
  CATALOG.set(pack.id, pack);
}

export const PACK_IDS: readonly PackId[] = [
  "editorial-bw",
  "warm-film",
  "poster-punch",
] as const;

export function listPacks(): Pack[] {
  return PACK_IDS.map((id) => CATALOG.get(id)!);
}

export function getPack(packId: string): Pack {
  const pack = CATALOG.get(packId);
  if (!pack) {
    throw new PackError("MISSING", `pack "${packId}" not in catalog`);
  }
  return pack;
}

export function tryGetPack(packId: string): Pack | null {
  return CATALOG.get(packId) ?? null;
}
