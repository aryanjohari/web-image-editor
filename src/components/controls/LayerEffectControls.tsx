import type { LayerEffectParams, LayerId } from "@/store/layerEffects";
import { STUDIO_LAYER_TAB_LABELS } from "@/constants/studioLabels";
import { useSynthStore } from "@/store/useSynthStore";

type LayerEffectKey = keyof LayerEffectParams;

type LayerSliderProps = {
  layer: LayerId;
  param: LayerEffectKey;
  label: string;
  min: number;
  max: number;
  step?: number;
  /** When set with `layer="text"`, edits that sublayer's unlinked effect bundle. */
  textSublayerId?: string;
};

function LayerSlider({ layer, param, label, min, max, step = 0.01, textSublayerId }: LayerSliderProps) {
  const value = useSynthStore((s) => {
    if (layer === "text" && textSublayerId) {
      return (s.textLayerEffects[textSublayerId]?.[param] ?? s.layerEffects.text[param]) as number;
    }
    return s.layerEffects[layer][param] as number;
  });
  const setLayerEffect = useSynthStore((s) => s.setLayerEffect);
  const setTextLayerEffect = useSynthStore((s) => s.setTextLayerEffect);

  const push = (next: number) => {
    if (layer === "text" && textSublayerId) {
      setTextLayerEffect(textSublayerId, param, next as LayerEffectParams[typeof param]);
    } else {
      setLayerEffect(layer, param, next as LayerEffectParams[typeof param]);
    }
  };

  return (
    <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
      <div className="flex items-center justify-between text-zinc-300">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        className="h-2 w-full cursor-pointer appearance-none rounded-none bg-zinc-800 accent-white"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => push(Number(e.target.value))}
        onInput={(e) => push(Number((e.target as HTMLInputElement).value))}
      />
    </label>
  );
}

type LayerEffectControlsProps = {
  layer: LayerId;
  /** When `layer` is `text`, targets `textLayerEffects[id]` instead of `layerEffects.text`. */
  textSublayerId?: string;
};

/** Full melt / mask / duotone / texture stack for one compositing layer (background, decal, or text). */
export function LayerEffectControls({ layer, textSublayerId }: LayerEffectControlsProps) {
  const colorA = useSynthStore((s) => {
    if (layer === "text" && textSublayerId) {
      return s.textLayerEffects[textSublayerId]?.colorA ?? s.layerEffects.text.colorA;
    }
    return s.layerEffects[layer].colorA;
  });
  const colorB = useSynthStore((s) => {
    if (layer === "text" && textSublayerId) {
      return s.textLayerEffects[textSublayerId]?.colorB ?? s.layerEffects.text.colorB;
    }
    return s.layerEffects[layer].colorB;
  });
  const setLayerEffect = useSynthStore((s) => s.setLayerEffect);
  const setTextLayerEffect = useSynthStore((s) => s.setTextLayerEffect);

  const pushColor = (key: "colorA" | "colorB", v: string) => {
    if (layer === "text" && textSublayerId) {
      setTextLayerEffect(textSublayerId, key, v);
    } else {
      setLayerEffect(layer, key, v);
    }
  };

  const title =
    layer === "text" && textSublayerId
      ? `Effects — ${STUDIO_LAYER_TAB_LABELS.text} (custom)`
      : `Effects — ${STUDIO_LAYER_TAB_LABELS[layer]}`;

  const sliderProps = { layer, textSublayerId } as const;

  return (
    <>
      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">{title}</p>
      <LayerSlider {...sliderProps} param="meltIntensity" label="Melt Intensity" min={0} max={1} />
      <LayerSlider {...sliderProps} param="colorBleed" label="Color Bleed" min={0} max={1} />
      <LayerSlider {...sliderProps} param="noiseLevel" label="Noise Level" min={0} max={0.5} />
      <LayerSlider
        {...sliderProps}
        param="posterizeSteps"
        label="Posterize Steps"
        min={2}
        max={24}
        step={1}
      />
      <LayerSlider {...sliderProps} param="timeScale" label="Time Scale" min={0} max={3} />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Mask
      </p>
      <LayerSlider {...sliderProps} param="maskCenterX" label="Mask Center X" min={0} max={1} />
      <LayerSlider {...sliderProps} param="maskCenterY" label="Mask Center Y" min={0} max={1} />
      <LayerSlider {...sliderProps} param="maskRadius" label="Mask Radius" min={0} max={1} />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Warp
      </p>
      <LayerSlider {...sliderProps} param="twirlIntensity" label="Twirl Intensity" min={-20} max={20} />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Duotone
      </p>
      <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
        <span className="text-zinc-300">Color A</span>
        <input
          type="color"
          className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
          value={colorA}
          onChange={(e) => pushColor("colorA", e.target.value)}
        />
      </label>
      <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
        <span className="text-zinc-300">Color B</span>
        <input
          type="color"
          className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
          value={colorB}
          onChange={(e) => pushColor("colorB", e.target.value)}
        />
      </label>
      <LayerSlider {...sliderProps} param="duotoneBlend" label="Duotone Blend" min={0} max={1} />
      <LayerSlider
        {...sliderProps}
        param="colorCycleSpeed"
        label="Color Cycle Speed"
        min={0}
        max={5}
      />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Textures
      </p>
      <LayerSlider {...sliderProps} param="halftoneIntensity" label="Halftone Intensity" min={0} max={1} />
      <LayerSlider {...sliderProps} param="scanlineIntensity" label="Scanline Intensity" min={0} max={1} />
    </>
  );
}
