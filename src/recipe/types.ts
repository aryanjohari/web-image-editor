/** Prism recipe document types (M01). Images are AssetRefs only — never bytes. */

export const SCHEMA_VERSION = "1" as const;
export const ENGINE_VERSION = "0.2.0" as const;

export type BlendMode = "normal" | "multiply" | "screen" | "overlay";
export type FitMode = "contain" | "cover" | "fill";
export type ObjectKind = "image" | "text";
export type ImageRole = "main" | "overlay";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AssetRef =
  | { type: "id"; assetId: string }
  | { type: "url"; url: string };

export type Transform2D = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fit?: FitMode;
};

export type Effect = {
  id: string;
  params: Record<string, number | string | boolean>;
};

/** Split grade stacks when main.maskRef is active (M05 M4). */
export type RegionalStack = {
  effects: Effect[];
};

export type RegionalGrade = {
  subject: RegionalStack;
  background: RegionalStack;
};

export type TextSource = {
  content: string;
  fontFamily: string;
  fontWeight: number | string;
  fontSize: number;
  letterSpacing?: number;
  lineHeight?: number;
  color: string;
  align?: "left" | "center" | "right";
};

export type RecipeObjectBase = {
  id: string;
  kind: ObjectKind;
  z: number;
  visible: boolean;
  opacity: number;
  blend: BlendMode;
  transform: Transform2D;
  crop?: CropRect;
  /** Tier B stub — must be absent/unused in Tier A. */
  maskRef?: AssetRef;
  effects: Effect[];
};

export type ImageObject = RecipeObjectBase & {
  kind: "image";
  role: ImageRole;
  source: AssetRef;
  /** Present when maskRef active on main (Tier B). */
  regional?: RegionalGrade;
};

export type TextObject = RecipeObjectBase & {
  kind: "text";
  text: TextSource;
};

export type RecipeObject = ImageObject | TextObject;

export type Recipe = {
  schemaVersion: string;
  engineVersion: string;
  packId: string | null;
  packVersion: string | null;
  canvas?: {
    width: number;
    height: number;
    background?: string;
  };
  meta?: {
    title?: string;
    createdAt?: string;
    notes?: string;
  };
  objects: RecipeObject[];
};

/** Ordered path/value patches (JSON Pointer into allowlisted prefixes). */
export type PathPatchOp = {
  path: string;
  value: JsonValue;
};

export type PathPatch = PathPatchOp[];
