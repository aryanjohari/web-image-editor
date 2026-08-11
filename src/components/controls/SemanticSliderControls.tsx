import { useCallback, useImperativeHandle, useState, type Ref } from "react";
import { SliderControl } from "@/components/controls/SliderControl";
import { applyPresetPatch } from "@/lib/preset";
import {
  DEFAULT_SEMANTIC,
  semanticSlidersToPatch,
  type SemanticSliderValues,
} from "@/lib/semantic/mapSemanticSliders";

export type SemanticSliderControlsHandle = {
  resetToDefaults: () => void;
};

export type SemanticSliderControlsProps = {
  resetRef?: Ref<SemanticSliderControlsHandle | null>;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  tone?: "lab" | "stage";
};

const SLIDERS: {
  key: keyof SemanticSliderValues;
  label: string;
  hint: string;
}[] = [
  { key: "intensity", label: "Intensity", hint: "Warp & color strength" },
  { key: "motion", label: "Motion", hint: "Animation speed" },
  { key: "grit", label: "Grit", hint: "Grain & texture" },
];

export function SemanticSliderControls({
  resetRef,
  onScrubStart,
  onScrubEnd,
  tone = "lab",
}: SemanticSliderControlsProps) {
  const [values, setValues] = useState<SemanticSliderValues>(DEFAULT_SEMANTIC);

  const applyValues = useCallback((next: SemanticSliderValues) => {
    setValues(next);
    applyPresetPatch(semanticSlidersToPatch(next));
  }, []);

  const resetToDefaults = useCallback(() => {
    applyValues(DEFAULT_SEMANTIC);
  }, [applyValues]);

  useImperativeHandle(resetRef, () => ({ resetToDefaults }), [resetToDefaults]);

  const stage = tone === "stage";

  return (
    <div className="flex flex-col gap-4">
      {!stage ? (
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Sliders set absolute background values and override mood or background look tweaks until you
          apply a new mood.
        </p>
      ) : null}
      {SLIDERS.map(({ key, label, hint }) => (
        <div key={key} className="flex flex-col gap-1">
          <SliderControl
            label={label}
            min={0}
            max={1}
            step={0.01}
            value={values[key]}
            tone={tone}
            onScrubStart={onScrubStart}
            onScrubEnd={onScrubEnd}
            onChange={(next) => {
              setValues((prev) => {
                const updated = { ...prev, [key]: next };
                applyPresetPatch(semanticSlidersToPatch(updated));
                return updated;
              });
            }}
          />
          <p className={stage ? "text-xs text-stage-muted" : "text-[10px] text-zinc-500"}>{hint}</p>
        </div>
      ))}
    </div>
  );
}
