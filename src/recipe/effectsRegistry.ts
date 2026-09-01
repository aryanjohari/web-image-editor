/** Closed Tier A effect registry (01 §6.7 / M01). */

export type EffectParamSpec =
  | { type: "number"; min: number; max: number; optional?: boolean }
  | { type: "string"; optional?: boolean }
  | { type: "boolean"; optional?: boolean };

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
    params: {
      amount: { type: "number", min: 0, max: 1 },
      /** Folded into UV hash; omit → 0 (M04 X7). */
      seed: { type: "number", min: 0, max: 1e9, optional: true },
      /** Grain character / clump size; omit → 0.5 mid (M06). */
      size: { type: "number", min: 0, max: 1, optional: true },
    },
  },
  vignette: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: 0, max: 1 } },
  },
  /** Neighborhood soft blur — ping-pong after pointwise grade (M06 §4.3). */
  blur: {
    kinds: ["image"],
    roles: ["main"],
    params: { amount: { type: "number", min: 0, max: 1 } },
  },
};

export function isKnownEffectId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(TIER_A_EFFECTS, id);
}
