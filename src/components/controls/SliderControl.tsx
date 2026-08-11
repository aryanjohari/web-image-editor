import type { PointerEvent as ReactPointerEvent } from "react";
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
  /** Pointer scrub only — do not call from keyboard/value change. */
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  /** Softer stage labels (sentence case) vs dense lab caps. */
  tone?: "lab" | "stage";
};

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 0.01,
  synthParam,
  onChange,
  onScrubStart,
  onScrubEnd,
  tone = "lab",
}: SliderControlProps) {
  const pushValue = (next: number) => {
    if (synthParam !== undefined) {
      useSynthStore.getState().setParam(synthParam, next as SynthParams[typeof synthParam]);
    }
    onChange?.(next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLInputElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Keep receiving move/up after Tune overlay hides (pointer-events-none).
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    onScrubStart?.();
  };

  const stage = tone === "stage";

  return (
    <label
      className={`flex w-full flex-col gap-2 ${
        stage ? "text-sm text-stage-text" : "text-xs uppercase tracking-wide"
      }`}
    >
      <div
        className={`flex items-center justify-between ${
          stage ? "text-stage-text" : "text-zinc-300"
        }`}
      >
        <span className={stage ? "font-medium" : undefined}>{label}</span>
        <span className={stage ? "tabular-nums text-stage-muted" : undefined}>
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        className={
          stage
            ? "h-2 w-full cursor-pointer appearance-none rounded-full bg-stage-elevated accent-[var(--stage-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
            : "h-2 w-full cursor-pointer appearance-none rounded-none bg-zinc-800 accent-white"
        }
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => pushValue(Number(event.target.value))}
        onInput={(event) => pushValue(Number((event.target as HTMLInputElement).value))}
        onPointerDown={onPointerDown}
        onPointerUp={() => onScrubEnd?.()}
        onPointerCancel={() => onScrubEnd?.()}
      />
    </label>
  );
}
