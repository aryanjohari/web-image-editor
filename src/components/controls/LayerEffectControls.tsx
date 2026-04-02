import type { LayerEffectParams, LayerId } from "@/store/layerEffects";
import { useSynthStore } from "@/store/useSynthStore";

type LayerEffectKey = keyof LayerEffectParams;

type LayerSliderProps = {
  layer: LayerId;
  param: LayerEffectKey;
  label: string;
  min: number;
  max: number;
  step?: number;
};

function LayerSlider({ layer, param, label, min, max, step = 0.01 }: LayerSliderProps) {
  const value = useSynthStore((s) => s.layerEffects[layer][param]) as number;
  const setLayerEffect = useSynthStore((s) => s.setLayerEffect);

  const push = (next: number) => {
    setLayerEffect(layer, param, next as LayerEffectParams[typeof param]);
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
};

/** Full melt / mask / duotone / texture stack for one compositing layer (background, decal, or text). */
export function LayerEffectControls({ layer }: LayerEffectControlsProps) {
  const colorA = useSynthStore((s) => s.layerEffects[layer].colorA);
  const colorB = useSynthStore((s) => s.layerEffects[layer].colorB);
  const setLayerEffect = useSynthStore((s) => s.setLayerEffect);

  return (
    <>
      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Effects — {layer}
      </p>
      <LayerSlider layer={layer} param="meltIntensity" label="Melt Intensity" min={0} max={1} />
      <LayerSlider layer={layer} param="colorBleed" label="Color Bleed" min={0} max={1} />
      <LayerSlider layer={layer} param="noiseLevel" label="Noise Level" min={0} max={0.5} />
      <LayerSlider
        layer={layer}
        param="posterizeSteps"
        label="Posterize Steps"
        min={2}
        max={24}
        step={1}
      />
      <LayerSlider layer={layer} param="timeScale" label="Time Scale" min={0} max={3} />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Mask
      </p>
      <LayerSlider layer={layer} param="maskCenterX" label="Mask Center X" min={0} max={1} />
      <LayerSlider layer={layer} param="maskCenterY" label="Mask Center Y" min={0} max={1} />
      <LayerSlider layer={layer} param="maskRadius" label="Mask Radius" min={0} max={1} />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Warp
      </p>
      <LayerSlider layer={layer} param="twirlIntensity" label="Twirl Intensity" min={-20} max={20} />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Duotone
      </p>
      <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
        <span className="text-zinc-300">Color A</span>
        <input
          type="color"
          className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
          value={colorA}
          onChange={(e) => setLayerEffect(layer, "colorA", e.target.value)}
        />
      </label>
      <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
        <span className="text-zinc-300">Color B</span>
        <input
          type="color"
          className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
          value={colorB}
          onChange={(e) => setLayerEffect(layer, "colorB", e.target.value)}
        />
      </label>
      <LayerSlider layer={layer} param="duotoneBlend" label="Duotone Blend" min={0} max={1} />
      <LayerSlider
        layer={layer}
        param="colorCycleSpeed"
        label="Color Cycle Speed"
        min={0}
        max={5}
      />

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Textures
      </p>
      <LayerSlider layer={layer} param="halftoneIntensity" label="Halftone Intensity" min={0} max={1} />
      <LayerSlider layer={layer} param="scanlineIntensity" label="Scanline Intensity" min={0} max={1} />
    </>
  );
}
