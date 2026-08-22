import type {
  AssetRef,
  BlendMode,
  Effect,
  ImageObject,
  Recipe,
  RecipeObject,
  TextObject,
  TextSource,
  Transform2D,
} from "./types";
import { ENGINE_VERSION, SCHEMA_VERSION } from "./types";

export function identityTransform(): Transform2D {
  return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
}

export function defaultTextSource(content = ""): TextSource {
  return {
    content,
    fontFamily: "IBM Plex Sans, sans-serif",
    fontWeight: 600,
    fontSize: 48,
    color: "#ffffff",
    align: "center",
  };
}

export function identityMainImage(assetId: string): ImageObject {
  return {
    id: "main",
    kind: "image",
    role: "main",
    z: 0,
    visible: true,
    opacity: 1,
    blend: "normal",
    transform: identityTransform(),
    effects: [],
    source: { type: "id", assetId },
  };
}

export function identityOverlayImage(assetId: string): ImageObject {
  return {
    id: "overlay",
    kind: "image",
    role: "overlay",
    z: 1,
    visible: true,
    opacity: 1,
    blend: "normal",
    transform: identityTransform(),
    effects: [],
    source: { type: "id", assetId },
  };
}

export function identityText(content = "Prism"): TextObject {
  return {
    id: "text",
    kind: "text",
    z: 2,
    visible: true,
    opacity: 1,
    blend: "normal",
    transform: { ...identityTransform(), y: -0.35 },
    effects: [],
    text: defaultTextSource(content),
  };
}

/** Empty lab recipe — no objects until upload. */
export function identityRecipe(): Recipe {
  return {
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    packId: null,
    packVersion: null,
    objects: [],
  };
}

export function recipeWithMain(assetId: string): Recipe {
  return {
    ...identityRecipe(),
    objects: [identityMainImage(assetId)],
  };
}

export type { AssetRef, BlendMode, Effect, Recipe, RecipeObject };
