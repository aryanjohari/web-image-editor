import { TIER_A_EFFECTS, isKnownEffectId } from "../recipe/effectsRegistry";
import type { BlendMode, Effect } from "../recipe/types";
import cleanEditorial from "./clean-editorial.json";
import coolChrome from "./cool-chrome.json";
import duskGrain from "./dusk-grain.json";
import editorialBw from "./editorial-bw.json";
import flashRaw from "./flash-raw.json";
import mutedSplit from "./muted-split.json";
import posterPunch from "./poster-punch.json";
import type {
  Pack,
  PackFamily,
  PackId,
  PackOverlayDefaults,
  PackRegionalDefaults,
  PackTextHints,
  TextPositionHint,
  TypePresetId,
} from "./types";
import { PACK_FAMILIES, TEXT_POSITIONS, TYPE_PRESETS } from "./types";
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
const FAMILY_SET = new Set<string>(PACK_FAMILIES);
const POSITION_SET = new Set<string>(TEXT_POSITIONS);
const PRESET_SET = new Set<string>(TYPE_PRESETS);

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

function validateRegionalDefaults(raw: unknown, path: string): PackRegionalDefaults | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PackError("TYPE", `${path} must be an object`);
  }
  const rec = raw as Record<string, unknown>;
  const out: PackRegionalDefaults = {};
  if ("subject" in rec) {
    if (!Array.isArray(rec.subject)) {
      throw new PackError("TYPE", `${path}.subject must be an array`);
    }
    out.subject = rec.subject.map((e, i) => validateEffect(e, `${path}.subject[${i}]`));
  }
  if ("background" in rec) {
    if (!Array.isArray(rec.background)) {
      throw new PackError("TYPE", `${path}.background must be an array`);
    }
    out.background = rec.background.map((e, i) =>
      validateEffect(e, `${path}.background[${i}]`),
    );
  }
  return out;
}

function validateTextHints(raw: unknown, path: string): PackTextHints | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PackError("TYPE", `${path} must be an object`);
  }
  const rec = raw as Record<string, unknown>;
  const position = expectString(rec.position, `${path}.position`);
  if (!POSITION_SET.has(position)) {
    throw new PackError("TEXT_HINT", `${path}.position invalid`);
  }
  const typePreset = expectString(rec.typePreset, `${path}.typePreset`);
  if (!PRESET_SET.has(typePreset)) {
    throw new PackError("TEXT_HINT", `${path}.typePreset invalid`);
  }
  return {
    position: position as TextPositionHint,
    typePreset: typePreset as TypePresetId,
  };
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
  const familyRaw = expectString(rec.family, "family");
  if (!FAMILY_SET.has(familyRaw)) {
    throw new PackError("FAMILY", `family "${familyRaw}" invalid`);
  }
  const family = familyRaw as PackFamily;
  if (!Array.isArray(rec.axes)) {
    throw new PackError("TYPE", "axes must be an array");
  }
  const axes = rec.axes.map((a, i) => expectString(a, `axes[${i}]`));
  if (!Array.isArray(rec.mainEffects)) {
    throw new PackError("TYPE", "mainEffects must be an array");
  }
  const mainEffects = rec.mainEffects.map((e, i) => validateEffect(e, `mainEffects[${i}]`));
  const overlay = validateOverlay(rec.overlay, "overlay");
  const regionalDefaults = validateRegionalDefaults(rec.regionalDefaults, "regionalDefaults");
  const textHints = validateTextHints(rec.textHints, "textHints");
  return {
    id,
    version,
    label,
    summary,
    family,
    axes,
    mainEffects,
    overlay,
    ...(regionalDefaults ? { regionalDefaults } : {}),
    ...(textHints ? { textHints } : {}),
  };
}

const RAW_PACKS: unknown[] = [
  warmFilm,
  duskGrain,
  flashRaw,
  coolChrome,
  editorialBw,
  cleanEditorial,
  mutedSplit,
  posterPunch,
];

const CATALOG: Map<string, Pack> = new Map();
for (const raw of RAW_PACKS) {
  const pack = validatePack(raw);
  if (CATALOG.has(pack.id)) {
    throw new PackError("DUP", `duplicate pack id "${pack.id}"`);
  }
  CATALOG.set(pack.id, pack);
}

export const PACK_IDS: readonly PackId[] = [
  "warm-film",
  "dusk-grain",
  "flash-raw",
  "cool-chrome",
  "editorial-bw",
  "clean-editorial",
  "muted-split",
  "poster-punch",
] as const;

export function listPacks(): Pack[] {
  return PACK_IDS.map((id) => CATALOG.get(id)!);
}

export function listPacksByFamily(family: PackFamily): Pack[] {
  return listPacks().filter((p) => p.family === family);
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
