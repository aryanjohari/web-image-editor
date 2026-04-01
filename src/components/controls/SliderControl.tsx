import type { SynthParams } from "@/store/useSynthStore";
import { useSynthStore } from "@/store/useSynthStore";

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Writes through `useSynthStore.getState().setParam` every move (not via React closure). */
  synthParam?: keyof SynthParams;
  onChange?: (value: number) => void;
};

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 0.01,
  synthParam,
  onChange,
}: SliderControlProps) {
  const pushValue = (next: number) => {
    if (synthParam !== undefined) {
      useSynthStore.getState().setParam(synthParam, next as SynthParams[typeof synthParam]);
    }
    onChange?.(next);
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
        onChange={(event) => pushValue(Number(event.target.value))}
        onInput={(event) => pushValue(Number((event.target as HTMLInputElement).value))}
      />
    </label>
  );
}
