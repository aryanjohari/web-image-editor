import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FORMULA_CATALOG,
  getFormulasForLayer,
  type FormulaEntry,
  type FormulaLayerTarget,
} from "@/data/formulaCatalog";
import type { LayerEffectParams } from "@/store/layerEffects";
import { useSynthStore } from "@/store/useSynthStore";

const LAYER_LABELS: Record<FormulaLayerTarget, string> = {
  background: "Background",
  decal: "Decal",
  text: "Text",
};

function FormulaSlider({ entry, layer }: { entry: FormulaEntry; layer: FormulaLayerTarget }) {
  const value = useSynthStore((s) => s.layerEffects[layer][entry.param] as number);
  const setLayerEffect = useSynthStore((s) => s.setLayerEffect);
  const step = entry.step ?? 0.01;
  const display =
    entry.param === "posterizeSteps" ? String(Math.round(value)) : value.toFixed(2);

  const push = (next: number) => {
    setLayerEffect(layer, entry.param, next as LayerEffectParams[typeof entry.param]);
  };

  return (
    <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
      <div className="flex items-center justify-between text-zinc-300">
        <span>{entry.label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        className="h-2 w-full cursor-pointer appearance-none rounded-none bg-zinc-800 accent-white"
        min={entry.min}
        max={entry.max}
        step={step}
        value={value}
        onChange={(e) => push(Number(e.target.value))}
        onInput={(e) => push(Number((e.target as HTMLInputElement).value))}
      />
    </label>
  );
}

export function FormulaPanel() {
  const [layer, setLayer] = useState<FormulaLayerTarget>("background");
  const formulas = getFormulasForLayer(layer);
  const [selectedId, setSelectedId] = useState<string>(formulas[0]?.id ?? FORMULA_CATALOG[0]?.id ?? "");
  const selected = formulas.find((f) => f.id === selectedId) ?? formulas[0];

  const layerBtn = (id: FormulaLayerTarget, label: string, showLeftBorder: boolean) => (
    <button
      type="button"
      className={`flex-1 py-2.5 text-[9px] uppercase tracking-[0.12em] transition-colors sm:text-[10px] sm:tracking-[0.16em] ${
        showLeftBorder ? "border-l border-white/25" : ""
      } ${
        layer === id ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
      onClick={() => {
        setLayer(id);
        const nextFormulas = getFormulasForLayer(id);
        setSelectedId(nextFormulas[0]?.id ?? "");
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[10px] leading-relaxed text-zinc-400">
        Pick a shader formula, read what it does, and edit one coefficient live.
      </p>

      <div className="flex w-full border border-white/25">
        {layerBtn("background", LAYER_LABELS.background, false)}
        {layerBtn("decal", LAYER_LABELS.decal, true)}
        {layerBtn("text", LAYER_LABELS.text, true)}
      </div>

      {formulas.length === 0 ? (
        <p className="text-[10px] text-zinc-500">No formulas for this layer yet.</p>
      ) : (
        <>
          <div className="flex max-h-36 flex-col gap-1.5 overflow-y-auto border border-white/20 p-2">
            {formulas.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`w-full rounded border px-2.5 py-2 text-left text-[10px] uppercase tracking-[0.16em] transition ${
                  selected?.id === entry.id
                    ? "border-white bg-white text-black"
                    : "border-white/25 text-zinc-200 hover:bg-white/5"
                }`}
                onClick={() => setSelectedId(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {selected ? (
            <div className="flex flex-col gap-4 border border-white/20 p-3">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{selected.category}</p>
                <h3 className="text-xs uppercase tracking-wide text-zinc-100">{selected.label}</h3>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400">{selected.plainEnglish}</p>
              <pre className="overflow-x-auto border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-200">
                {selected.equation}
              </pre>
              <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                See MATH.md → {selected.shaderRef}
              </p>
              <FormulaSlider entry={selected} layer={layer} />
            </div>
          ) : null}
        </>
      )}

      <p className="text-[10px] leading-relaxed text-zinc-500">
        Full glossary →{" "}
        <Link to="/story" className="text-zinc-300 underline hover:text-white">
          MATH.md on /story
        </Link>
      </p>
    </div>
  );
}
