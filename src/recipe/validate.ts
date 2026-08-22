import { TIER_A_EFFECTS, isKnownEffectId } from "./effectsRegistry";
import type {
  AssetRef,
  BlendMode,
  CropRect,
  Effect,
  ImageObject,
  Recipe,
  RecipeObject,
  TextObject,
  TextSource,
  Transform2D,
} from "./types";
import { ENGINE_VERSION, SCHEMA_VERSION } from "./types";

export class RecipeValidationError extends Error {
  readonly code: string;
  readonly path: string;

  constructor(code: string, path: string, message: string) {
    super(message);
    this.name = "RecipeValidationError";
    this.code = code;
    this.path = path;
  }
}

const BLENDS = new Set<BlendMode>(["normal", "multiply", "screen", "overlay"]);
const FITS = new Set(["contain", "cover", "fill"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function expectFinite(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be a finite number`);
  }
  return v;
}

function expectString(v: unknown, path: string): string {
  if (typeof v !== "string") {
    throw new RecipeValidationError("TYPE", path, `${path} must be a string`);
  }
  return v;
}

function expectBool(v: unknown, path: string): boolean {
  if (typeof v !== "boolean") {
    throw new RecipeValidationError("TYPE", path, `${path} must be a boolean`);
  }
  return v;
}

function expectRange(n: number, min: number, max: number, path: string): number {
  if (n < min || n > max) {
    throw new RecipeValidationError(
      "OOR",
      path,
      `${path} out of range [${min}, ${max}] (got ${n})`,
    );
  }
  return n;
}

function validateAssetRef(raw: unknown, path: string): AssetRef {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be an object`);
  }
  if (raw.type === "id") {
    const assetId = expectString(raw.assetId, `${path}.assetId`);
    if (!assetId) {
      throw new RecipeValidationError("EMPTY", `${path}.assetId`, "assetId must be non-empty");
    }
    return { type: "id", assetId };
  }
  if (raw.type === "url") {
    const url = expectString(raw.url, `${path}.url`);
    if (!url) {
      throw new RecipeValidationError("EMPTY", `${path}.url`, "url must be non-empty");
    }
    return { type: "url", url };
  }
  if (raw.type === "inline") {
    throw new RecipeValidationError(
      "INLINE_BYTES",
      path,
      "inline/base64 AssetRef is forbidden",
    );
  }
  throw new RecipeValidationError(
    "ASSET_REF",
    path,
    `${path}.type must be "id" or "url"`,
  );
}

function validateTransform(raw: unknown, path: string): Transform2D {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be an object`);
  }
  return {
    x: expectFinite(raw.x, `${path}.x`),
    y: expectFinite(raw.y, `${path}.y`),
    scaleX: expectFinite(raw.scaleX, `${path}.scaleX`),
    scaleY: expectFinite(raw.scaleY, `${path}.scaleY`),
    rotation: expectFinite(raw.rotation, `${path}.rotation`),
  };
}

function validateCrop(raw: unknown, path: string): CropRect {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be an object`);
  }
  const crop: CropRect = {
    x: expectFinite(raw.x, `${path}.x`),
    y: expectFinite(raw.y, `${path}.y`),
    width: expectFinite(raw.width, `${path}.width`),
    height: expectFinite(raw.height, `${path}.height`),
  };
  if (raw.fit !== undefined) {
    const fit = expectString(raw.fit, `${path}.fit`);
    if (!FITS.has(fit)) {
      throw new RecipeValidationError("ENUM", `${path}.fit`, `unsupported fit "${fit}"`);
    }
    crop.fit = fit as CropRect["fit"];
  }
  return crop;
}

function validateTextSource(raw: unknown, path: string): TextSource {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be an object`);
  }
  const content = expectString(raw.content, `${path}.content`);
  const fontFamily = expectString(raw.fontFamily, `${path}.fontFamily`);
  const fontSize = expectRange(
    expectFinite(raw.fontSize, `${path}.fontSize`),
    1,
    1024,
    `${path}.fontSize`,
  );
  const color = expectString(raw.color, `${path}.color`);
  let fontWeight: number | string;
  if (typeof raw.fontWeight === "number") {
    fontWeight = expectFinite(raw.fontWeight, `${path}.fontWeight`);
  } else {
    fontWeight = expectString(raw.fontWeight, `${path}.fontWeight`);
  }
  const text: TextSource = { content, fontFamily, fontWeight, fontSize, color };
  if (raw.letterSpacing !== undefined) {
    text.letterSpacing = expectFinite(raw.letterSpacing, `${path}.letterSpacing`);
  }
  if (raw.lineHeight !== undefined) {
    text.lineHeight = expectFinite(raw.lineHeight, `${path}.lineHeight`);
  }
  if (raw.align !== undefined) {
    const align = expectString(raw.align, `${path}.align`);
    if (align !== "left" && align !== "center" && align !== "right") {
      throw new RecipeValidationError("ENUM", `${path}.align`, `bad align "${align}"`);
    }
    text.align = align;
  }
  return text;
}

function validateEffect(
  raw: unknown,
  path: string,
  kind: RecipeObject["kind"],
  role?: ImageObject["role"],
): Effect {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be an object`);
  }
  const id = expectString(raw.id, `${path}.id`);
  if (!isKnownEffectId(id)) {
    throw new RecipeValidationError("UNKNOWN_EFFECT", `${path}.id`, `unknown effect "${id}"`);
  }
  const spec = TIER_A_EFFECTS[id];
  if (!spec.kinds.includes(kind)) {
    throw new RecipeValidationError(
      "EFFECT_KIND",
      path,
      `effect "${id}" not allowed on kind=${kind}`,
    );
  }
  if (kind === "image" && spec.roles && role && !spec.roles.includes(role)) {
    throw new RecipeValidationError(
      "EFFECT_ROLE",
      path,
      `effect "${id}" not allowed on role=${role}`,
    );
  }
  if (kind === "text") {
    throw new RecipeValidationError(
      "EFFECT_KIND",
      path,
      "text objects must have effects: [] in Tier A",
    );
  }
  if (!isRecord(raw.params)) {
    throw new RecipeValidationError("TYPE", `${path}.params`, `${path}.params must be an object`);
  }
  const params: Effect["params"] = {};
  for (const key of Object.keys(raw.params)) {
    if (!Object.prototype.hasOwnProperty.call(spec.params, key)) {
      throw new RecipeValidationError(
        "UNKNOWN_PARAM",
        `${path}.params.${key}`,
        `unknown param "${key}" for effect "${id}"`,
      );
    }
  }
  for (const [key, pspec] of Object.entries(spec.params)) {
    if (!(key in raw.params)) {
      throw new RecipeValidationError(
        "MISSING_PARAM",
        `${path}.params.${key}`,
        `missing required param "${key}" for effect "${id}"`,
      );
    }
    const val = raw.params[key];
    if (pspec.type === "number") {
      const n = expectFinite(val, `${path}.params.${key}`);
      params[key] = expectRange(n, pspec.min, pspec.max, `${path}.params.${key}`);
    } else if (pspec.type === "string") {
      params[key] = expectString(val, `${path}.params.${key}`);
    } else {
      params[key] = expectBool(val, `${path}.params.${key}`);
    }
  }
  return { id, params };
}

function validateObject(raw: unknown, path: string): RecipeObject {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", path, `${path} must be an object`);
  }
  const id = expectString(raw.id, `${path}.id`);
  if (!id) {
    throw new RecipeValidationError("EMPTY", `${path}.id`, "object id must be non-empty");
  }
  const kind = expectString(raw.kind, `${path}.kind`);
  if (kind !== "image" && kind !== "text") {
    throw new RecipeValidationError(
      "UNSUPPORTED_KIND",
      `${path}.kind`,
      `unsupported active object kind "${kind}"`,
    );
  }
  const z = expectFinite(raw.z, `${path}.z`);
  const visible = expectBool(raw.visible, `${path}.visible`);
  const opacity = expectRange(expectFinite(raw.opacity, `${path}.opacity`), 0, 1, `${path}.opacity`);
  const blendRaw = expectString(raw.blend, `${path}.blend`);
  if (!BLENDS.has(blendRaw as BlendMode)) {
    throw new RecipeValidationError("ENUM", `${path}.blend`, `unsupported blend "${blendRaw}"`);
  }
  const blend = blendRaw as BlendMode;
  const transform = validateTransform(raw.transform, `${path}.transform`);
  const crop = raw.crop !== undefined ? validateCrop(raw.crop, `${path}.crop`) : undefined;

  if (raw.maskRef !== undefined && raw.maskRef !== null) {
    // Tier A: any present maskRef on a visible object is an active unsupported feature.
    if (visible) {
      throw new RecipeValidationError(
        "MASK_ACTIVE",
        `${path}.maskRef`,
        "maskRef is not admitted in Tier A",
      );
    }
  }

  if (!Array.isArray(raw.effects)) {
    throw new RecipeValidationError("TYPE", `${path}.effects`, `${path}.effects must be an array`);
  }

  if (kind === "text") {
    if (raw.effects.length > 0) {
      throw new RecipeValidationError(
        "EFFECT_KIND",
        `${path}.effects`,
        "text objects must have effects: [] in Tier A",
      );
    }
    const text = validateTextSource(raw.text, `${path}.text`);
    const obj: TextObject = {
      id,
      kind: "text",
      z,
      visible,
      opacity,
      blend,
      transform,
      effects: [],
      text,
    };
    if (crop) obj.crop = crop;
    return obj;
  }

  const role = expectString(raw.role, `${path}.role`);
  if (role !== "main" && role !== "overlay") {
    throw new RecipeValidationError("ENUM", `${path}.role`, `unsupported role "${role}"`);
  }
  const source = validateAssetRef(raw.source, `${path}.source`);
  const effects = raw.effects.map((e, i) =>
    validateEffect(e, `${path}.effects[${i}]`, "image", role),
  );
  const obj: ImageObject = {
    id,
    kind: "image",
    role,
    z,
    visible,
    opacity,
    blend,
    transform,
    effects,
    source,
  };
  if (crop) obj.crop = crop;
  return obj;
}

function assertRoundTripSafe(recipe: Recipe): void {
  const round = JSON.parse(JSON.stringify(recipe)) as unknown;
  if (JSON.stringify(round) !== JSON.stringify(recipe)) {
    throw new RecipeValidationError(
      "ROUNDTRIP",
      "",
      "recipe failed JSON round-trip equality",
    );
  }
}

/**
 * Parse + validate a recipe. Fail closed: unsupported active kinds/caps/effects reject.
 */
export function validateRecipe(raw: unknown): Recipe {
  if (!isRecord(raw)) {
    throw new RecipeValidationError("TYPE", "", "recipe must be a JSON object");
  }

  const schemaVersion = expectString(raw.schemaVersion, "schemaVersion");
  if (schemaVersion !== SCHEMA_VERSION) {
    throw new RecipeValidationError(
      "SCHEMA_VERSION",
      "schemaVersion",
      `unsupported schemaVersion "${schemaVersion}" (expected ${SCHEMA_VERSION})`,
    );
  }
  const engineVersion = expectString(raw.engineVersion, "engineVersion");
  if (!engineVersion) {
    throw new RecipeValidationError("EMPTY", "engineVersion", "engineVersion must be non-empty");
  }

  let packId: string | null = null;
  if (raw.packId !== null && raw.packId !== undefined) {
    packId = expectString(raw.packId, "packId");
  }
  let packVersion: string | null = null;
  if (raw.packVersion !== null && raw.packVersion !== undefined) {
    packVersion = expectString(raw.packVersion, "packVersion");
  }

  if (!Array.isArray(raw.objects)) {
    throw new RecipeValidationError("TYPE", "objects", "objects must be an array");
  }

  const objects = raw.objects.map((o, i) => validateObject(o, `objects[${i}]`));

  // Tier A caps among visible objects
  const active = objects.filter((o) => o.visible);
  const mains = active.filter((o) => o.kind === "image" && o.role === "main");
  const overlays = active.filter((o) => o.kind === "image" && o.role === "overlay");
  const texts = active.filter((o) => o.kind === "text");
  if (mains.length > 1) {
    throw new RecipeValidationError("CAP", "objects", "Tier A allows at most 1 active main image");
  }
  if (overlays.length > 1) {
    throw new RecipeValidationError(
      "CAP",
      "objects",
      "Tier A allows at most 1 active overlay image",
    );
  }
  if (texts.length > 1) {
    throw new RecipeValidationError("CAP", "objects", "Tier A allows at most 1 active text object");
  }

  const ids = new Set<string>();
  for (const o of objects) {
    if (ids.has(o.id)) {
      throw new RecipeValidationError("DUP_ID", "objects", `duplicate object id "${o.id}"`);
    }
    ids.add(o.id);
  }

  const recipe: Recipe = {
    schemaVersion,
    engineVersion,
    packId,
    packVersion,
    objects,
  };

  if (raw.canvas !== undefined) {
    if (!isRecord(raw.canvas)) {
      throw new RecipeValidationError("TYPE", "canvas", "canvas must be an object");
    }
    recipe.canvas = {
      width: expectFinite(raw.canvas.width, "canvas.width"),
      height: expectFinite(raw.canvas.height, "canvas.height"),
    };
    if (raw.canvas.background !== undefined) {
      recipe.canvas.background = expectString(raw.canvas.background, "canvas.background");
    }
  }

  if (raw.meta !== undefined) {
    if (!isRecord(raw.meta)) {
      throw new RecipeValidationError("TYPE", "meta", "meta must be an object");
    }
    recipe.meta = {};
    if (raw.meta.title !== undefined) {
      recipe.meta.title = expectString(raw.meta.title, "meta.title");
    }
    if (raw.meta.createdAt !== undefined) {
      recipe.meta.createdAt = expectString(raw.meta.createdAt, "meta.createdAt");
    }
    if (raw.meta.notes !== undefined) {
      recipe.meta.notes = expectString(raw.meta.notes, "meta.notes");
    }
  }

  // Soft check: prefer known engine, but do not hard-fail on engineVersion string
  // beyond non-empty — ENGINE_VERSION is documentation for this build.
  void ENGINE_VERSION;

  assertRoundTripSafe(recipe);
  return recipe;
}

export function tryValidateRecipe(
  raw: unknown,
): { ok: true; recipe: Recipe } | { ok: false; error: RecipeValidationError } {
  try {
    return { ok: true, recipe: validateRecipe(raw) };
  } catch (e) {
    if (e instanceof RecipeValidationError) {
      return { ok: false, error: e };
    }
    throw e;
  }
}
