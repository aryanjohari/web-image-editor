/** Closed Tier A effect registry (01 §6.7 / M01). */

export type EffectParamSpec =
  | { type: "number"; min: number; max: number }
  | { type: "string" }
  | { type: "boolean" };

export type EffectSpec = {
  params: Record<string, EffectParamSpec>;
  /** Which object kinds may carry this effect. */
  kinds: ReadonlyArray<"image" | "text">;
  /** Optional image role restriction. */
  roles?: ReadonlyArray<"main" | "overlay">;
};

export const TIER_A_EFFECTS: Record<string, EffectSpec> = {
  exposure: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: -2, max: 2 } },
  },
  contrast: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: -1, max: 1 } },
  },
  saturation: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: -1, max: 1 } },
  },
  temperature: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: -1, max: 1 } },
  },
  fade: {
    kinds: ["image"],
    roles: ["main", "overlay"],
    params: { amount: { type: "number", min: 0, max: 1 } },
  },
  duotone: {
    kinds: ["image"],
    roles: ["main", "overlay"],
    params: {
      amount: { type: "number", min: 0, max: 1 },
      shadow: { type: "string" },
      highlight: { type: "string" },
    },
  },
  grain: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: 0, max: 1 } },
  },
  vignette: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: 0, max: 1 } },
  },
};

export function isKnownEffectId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(TIER_A_EFFECTS, id);
}
