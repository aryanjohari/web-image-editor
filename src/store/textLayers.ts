import { createDefaultLayerEffects, type LayerEffectParams } from "./layerEffects";

export const MAX_TEXT_LAYERS = 4;

export type TextLayer = {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  effectsLinked: boolean;
};

export function createTextLayer(partial?: Partial<TextLayer>): TextLayer {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    text: partial?.text ?? "",
    color: partial?.color ?? "#ffffff",
    fontSize: partial?.fontSize ?? 100,
    offsetX: partial?.offsetX ?? 0,
    offsetY: partial?.offsetY ?? 0,
    scale: partial?.scale ?? 1,
    effectsLinked: partial?.effectsLinked ?? true,
  };
}

export function initialTextLayersBootstrap(): { textLayers: TextLayer[]; selectedTextLayerId: string } {
  const first = createTextLayer();
  return { textLayers: [first], selectedTextLayerId: first.id };
}

/** Resolve effect params for a text layer when pushing uniforms. */
export function resolveTextLayerEffects(
  layer: TextLayer,
  master: LayerEffectParams,
  textLayerEffects: Record<string, LayerEffectParams>,
): LayerEffectParams {
  if (layer.effectsLinked) {
    return master;
  }
  return textLayerEffects[layer.id] ?? master;
}

export function cloneDefaultTextLayerEffects(): LayerEffectParams {
  return createDefaultLayerEffects();
}
