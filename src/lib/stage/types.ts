/**
 * Stage Phase 0 — frozen product contracts.
 * Phase 1: compositor still uses SynthPreset v2; adapt via adaptPreset.ts.
 *
 * @see docs/DIRECTION.md
 */

/** Bump when StageRecipe / BrandKit / StageJob break consumers. */
export const STAGE_CONTRACT_VERSION = "stage-phase0-2026-08-10" as const;

/** Recipe document version (product schema, not GPU engineVersion). */
export const STAGE_RECIPE_SCHEMA_VERSION = 3 as const;

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export type StageAssetKind = "image" | "logo" | "decal";

export type StageAssetRef = {
  id: string;
  kind: StageAssetKind;
  /** Mime of source bytes when known */
  mime?: string;
  /** Resolved URL after upload (CDN / blob / data URL for local-only) */
  url?: string;
  /** Optional inline payload for portable recipes (prefer url in API mode) */
  dataBase64?: string;
  width?: number;
  height?: number;
};

// ---------------------------------------------------------------------------
// Brand kit
// ---------------------------------------------------------------------------

export type StageColorToken = {
  id: string;
  /** Hex, e.g. #0a0b0c */
  hex: string;
  role?: "primary" | "secondary" | "accent" | "background" | "foreground" | "muted";
};

export type StageFontToken = {
  id: string;
  family: string;
  role?: "display" | "body" | "mono";
  /** CSS weight hint */
  weight?: number;
};

/**
 * Effect / look constraints the LLM and UI must respect.
 * Catalog look ids align with existing presetCatalog ids where possible.
 */
export type StageBrandLimits = {
  /** Empty / omit = any catalog look allowed */
  allowedLookIds?: string[];
  /** Hard caps on shader params (0–1-ish domains match LayerEffectParams scales) */
  maxMeltIntensity?: number;
  maxNoiseLevel?: number;
  maxScanlineIntensity?: number;
  requireReducedMotionTwin?: boolean;
};

export type StageBrandKit = {
  id: string;
  name: string;
  /** Freeform notes for the LLM (voice, do/don't) */
  voiceNotes?: string;
  colors: StageColorToken[];
  fonts: StageFontToken[];
  logoAssetId?: string;
  limits?: StageBrandLimits;
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Scene layers → StageRecipe (v3)
// ---------------------------------------------------------------------------

export type StageLayerType = "image" | "decal" | "text";

/** Normalized transform: offsets in -1…1 style space matching current studio conventions. */
export type StageLayerTransform = {
  offsetX: number;
  offsetY: number;
  scale: number;
  /** Degrees; 0 default. Reserved for Phase 1+ */
  rotationDeg?: number;
};

/**
 * Subset mirrored from LayerEffectParams — keep field names aligned with the engine
 * so Phase 1 adaptors stay mechanical.
 */
export type StageLayerEffects = {
  meltIntensity: number;
  colorBleed: number;
  noiseLevel: number;
  posterizeSteps: number;
  timeScale: number;
  maskCenterX: number;
  maskCenterY: number;
  maskRadius: number;
  twirlIntensity: number;
  colorA: string;
  colorB: string;
  duotoneBlend: number;
  colorCycleSpeed: number;
  halftoneIntensity: number;
  scanlineIntensity: number;
};

export type StageImageLayer = {
  type: "image";
  id: string;
  assetId: string;
  transform: StageLayerTransform;
  effects: StageLayerEffects;
  /** z-order; lower draws first */
  zIndex: number;
  visible?: boolean;
};

export type StageDecalLayer = {
  type: "decal";
  id: string;
  assetId: string;
  transform: StageLayerTransform;
  effects: StageLayerEffects;
  linkEffectsToBackground?: boolean;
  zIndex: number;
  visible?: boolean;
};

export type StageTextLayer = {
  type: "text";
  id: string;
  text: string;
  color: string;
  fontSize: number;
  /** Brand font token id when set */
  fontId?: string;
  transform: StageLayerTransform;
  effects: StageLayerEffects;
  effectsLinked?: boolean;
  zIndex: number;
  visible?: boolean;
};

export type StageLayer = StageImageLayer | StageDecalLayer | StageTextLayer;

export type StageViewport = {
  drawBufferWidth: number;
  drawBufferHeight: number;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
};

/**
 * Portable scene — product contract for Stage.
 * Phase 1: hydrate compositor from this (via adaptor from/to SynthPreset v2).
 */
export type StageRecipe = {
  recipeSchemaVersion: typeof STAGE_RECIPE_SCHEMA_VERSION;
  /** GPU / app engine build string — keep compatible with preset engineVersion style */
  engineVersion: string;
  brandId?: string;
  /** Named pack profile this recipe was authored against (optional) */
  targetPackProfileId?: string;
  layers: StageLayer[];
  assets: Record<string, StageAssetRef>;
  viewport: StageViewport;
  baseTimeSeconds: number;
  /** Catalog look id if seeded from a preset */
  baseLookId?: string;
  meta?: {
    title?: string;
    brief?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

/** LLM / API may return a full recipe or a partial patch (JSON Merge Patch style object). */
export type StageRecipePatch = Record<string, unknown>;

export type StageLlmSceneResponse = {
  recipe?: StageRecipe;
  patch?: StageRecipePatch;
  /** Human-readable note for UI */
  summary?: string;
};

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type StageJobStatus =
  | "queued"
  | "running"
  | "awaiting_client_render"
  | "succeeded"
  | "failed"
  | "cancelled";

export type StageJobOptions = {
  /** Default pack: square + story + web_hero */
  packProfileIds?: string[];
  /** When true and server flag enabled, may call plate gen */
  allowPlateGeneration?: boolean;
  /** Seed look from catalog */
  baseLookId?: string;
};

export type StageJobRequest = {
  brandId: string;
  brief: string;
  /** Uploaded asset ids to place / prefer */
  assetIds?: string[];
  /** Continue from an existing recipe (conversational turn) */
  baseRecipeId?: string;
  options?: StageJobOptions;
};

export type StageExportArtifact = {
  packProfileId: string;
  kind: "png" | "webm" | "json";
  /** URL after client upload or server store */
  url?: string;
  width?: number;
  height?: number;
};

export type StageJob = {
  id: string;
  status: StageJobStatus;
  request: StageJobRequest;
  recipe?: StageRecipe;
  artifacts?: StageExportArtifact[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Feature flags (client + server documentation)
// ---------------------------------------------------------------------------

export type StageFeatureFlags = {
  /** Plate generation (Gemini or equivalent) — optional; upload remains primary */
  plateGenerationEnabled: boolean;
  /** When false, LLM path is disabled; keyword/catalog-only UX may still run */
  llmStateOperatorEnabled: boolean;
};
