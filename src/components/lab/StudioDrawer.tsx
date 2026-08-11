import { useRef } from "react";
import { FormulaPanel } from "@/components/controls/FormulaPanel";
import { LayerEffectControls } from "@/components/controls/LayerEffectControls";
import { SemanticSliderControls, type SemanticSliderControlsHandle } from "@/components/controls/SemanticSliderControls";
import { SliderControl } from "@/components/controls/SliderControl";
import { IdeasGallery } from "@/components/IdeasGallery";
import { PreserveTextToggle } from "@/components/PreserveTextToggle";
import { STUDIO_LAYER_TAB_LABELS } from "@/constants/studioLabels";
import { MAX_TEXT_LAYERS } from "@/store/textLayers";
import { useSynthStore } from "@/store/useSynthStore";

const SECTION_HEADING = "text-[10px] uppercase tracking-[0.2em] text-zinc-400";
const DETAILS_SUMMARY =
  "cursor-pointer list-none px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-300 hover:bg-white/5 [&::-webkit-details-marker]:hidden";

export type StudioDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Slim right Studio drawer — featured looks + tune + collapsed advanced.
 * Brand / assets / brief / export live in Library + floating AI + top bar.
 */
export function StudioDrawer({ open, onClose }: StudioDrawerProps) {
  const semanticRef = useRef<SemanticSliderControlsHandle | null>(null);

  const {
    stackTab,
    setStackTab,
    decalScale,
    decalBackgroundLumaMask,
    decalTexture,
    linkDecalToMath,
    linkTextToMath,
    setParam,
    textLayers,
    selectedTextLayerId,
    setSelectedTextLayerId,
    addTextLayer,
    removeTextLayer,
    updateTextLayer,
    setTextLayerEffectsLinked,
  } = useSynthStore();

  const selectedLayer = textLayers.find((l) => l.id === selectedTextLayerId) ?? null;
  const hasDecalImage = decalTexture != null;

  const tabBtn = (id: typeof stackTab, label: string, showLeftBorder: boolean) => (
    <button
      type="button"
      className={`flex-1 py-2.5 text-[9px] uppercase tracking-[0.12em] transition-colors sm:text-[10px] sm:tracking-[0.16em] ${
        showLeftBorder ? "border-l border-white/25" : ""
      } ${
        stackTab === id ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      }`}
      onClick={() => setStackTab(id)}
    >
      {label}
    </button>
  );

  const advancedBody = (
    <>
      <div className="flex w-full border border-white/25">
        {tabBtn("background", STUDIO_LAYER_TAB_LABELS.background, false)}
        {tabBtn("decal", STUDIO_LAYER_TAB_LABELS.decal, true)}
        {tabBtn("text", STUDIO_LAYER_TAB_LABELS.text, true)}
      </div>

      {stackTab === "background" ? (
        <>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Set the hero from Library → Assets.
          </p>
          <LayerEffectControls layer="background" />
        </>
      ) : stackTab === "decal" ? (
        <>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Set the overlay from Library → Assets (PNG / WebP).
          </p>
          <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Placement
          </p>
          <SliderControl
            label="Overlay scale"
            min={0.1}
            max={4}
            value={decalScale}
            synthParam="decalScale"
          />
          <SliderControl
            label="Hero × overlay luminance"
            min={0}
            max={1}
            value={decalBackgroundLumaMask}
            synthParam="decalBackgroundLumaMask"
          />
          <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
            <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200">
              Link overlay to warp math
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={linkDecalToMath}
              onClick={() => setParam("linkDecalToMath", !linkDecalToMath)}
              className={`relative h-7 w-11 shrink-0 border border-white/35 transition-colors ${
                linkDecalToMath ? "bg-white" : "bg-zinc-900"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 bg-black transition-[left] ${
                  linkDecalToMath ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
                aria-hidden
              />
            </button>
          </div>
          <LayerEffectControls layer="decal" />
        </>
      ) : (
        <>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Lab-only headline for layout preview — use HTML above the canvas on your site.
          </p>
          <div className="flex flex-wrap gap-2">
            {textLayers.map((l, idx) => (
              <button
                key={l.id}
                type="button"
                className={`border px-2 py-1 text-[10px] uppercase tracking-wide ${
                  selectedTextLayerId === l.id
                    ? "border-white bg-white text-black"
                    : "border-white/25 text-zinc-300"
                }`}
                onClick={() => setSelectedTextLayerId(l.id)}
              >
                {idx + 1}
              </button>
            ))}
            {textLayers.length < MAX_TEXT_LAYERS ? (
              <button
                type="button"
                className="border border-dashed border-white/35 px-2 py-1 text-[10px] uppercase text-zinc-400"
                onClick={() => addTextLayer()}
              >
                + Add
              </button>
            ) : null}
            {selectedLayer && textLayers.length > 0 ? (
              <button
                type="button"
                className="border border-white/25 px-2 py-1 text-[10px] uppercase text-zinc-400"
                onClick={() => removeTextLayer(selectedLayer.id)}
              >
                Remove
              </button>
            ) : null}
          </div>

          {selectedLayer ? (
            <>
              <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
                <span className="text-zinc-300">Preview copy</span>
                <textarea
                  rows={4}
                  className="min-h-[4rem] w-full resize-y border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm normal-case tracking-normal text-white"
                  value={selectedLayer.text}
                  onChange={(e) => updateTextLayer(selectedLayer.id, { text: e.target.value })}
                />
              </label>
              <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
                <span className="text-zinc-300">Text Color</span>
                <input
                  type="color"
                  className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
                  value={selectedLayer.color}
                  onChange={(e) => updateTextLayer(selectedLayer.id, { color: e.target.value })}
                />
              </label>
              <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Text Size</span>
                  <span>{selectedLayer.fontSize}</span>
                </div>
                <input
                  type="range"
                  className="h-2 w-full cursor-pointer appearance-none rounded-none bg-zinc-800 accent-white"
                  min={24}
                  max={320}
                  step={1}
                  value={selectedLayer.fontSize}
                  onChange={(e) =>
                    updateTextLayer(selectedLayer.id, { fontSize: Number(e.target.value) })
                  }
                />
              </label>
              {hasDecalImage ? (
                <>
                  <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Preview text scale</span>
                      <span>{selectedLayer.scale.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      className="h-2 w-full cursor-pointer appearance-none rounded-none bg-zinc-800 accent-white"
                      min={0.1}
                      max={4}
                      step={0.01}
                      value={selectedLayer.scale}
                      onChange={(e) =>
                        updateTextLayer(selectedLayer.id, { scale: Number(e.target.value) })
                      }
                    />
                  </label>
                  <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
                    <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200">
                      Link preview text to warp math
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={linkTextToMath}
                      onClick={() => setParam("linkTextToMath", !linkTextToMath)}
                      className={`relative h-7 w-11 shrink-0 border border-white/35 transition-colors ${
                        linkTextToMath ? "bg-white" : "bg-zinc-900"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 bg-black transition-[left] ${
                          linkTextToMath ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                        }`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <SliderControl
                    label="Preview text scale"
                    min={0.1}
                    max={4}
                    value={decalScale}
                    synthParam="decalScale"
                  />
                  <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
                    <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200">
                      Link preview text to warp math
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={linkDecalToMath}
                      onClick={() => setParam("linkDecalToMath", !linkDecalToMath)}
                      className={`relative h-7 w-11 shrink-0 border border-white/35 transition-colors ${
                        linkDecalToMath ? "bg-white" : "bg-zinc-900"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 bg-black transition-[left] ${
                          linkDecalToMath ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                        }`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
                <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200">
                  Link effects to master
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={selectedLayer.effectsLinked}
                  onClick={() =>
                    setTextLayerEffectsLinked(selectedLayer.id, !selectedLayer.effectsLinked)
                  }
                  className={`relative h-7 w-11 shrink-0 border border-white/35 transition-colors ${
                    selectedLayer.effectsLinked ? "bg-white" : "bg-zinc-900"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 bg-black transition-[left] ${
                      selectedLayer.effectsLinked ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                    }`}
                    aria-hidden
                  />
                </button>
              </div>
              {selectedLayer.effectsLinked ? (
                <LayerEffectControls layer="text" />
              ) : (
                <LayerEffectControls layer="text" textSublayerId={selectedLayer.id} />
              )}
            </>
          ) : (
            <p className="text-[10px] text-zinc-500">Add preview text to begin.</p>
          )}
        </>
      )}
    </>
  );

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-black/40 md:bg-transparent"
          aria-label="Close studio"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/20 bg-panel/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out md:w-[min(100vw,360px)] ${
          open ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/20 px-4 py-3">
          <h2 className="text-sm uppercase tracking-[0.22em]">Studio</h2>
          <button
            type="button"
            className="border border-white/35 px-2 py-1 text-[10px] uppercase tracking-widest"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <section className="flex flex-col gap-3" aria-labelledby="studio-look-heading">
            <h3 id="studio-look-heading" className={SECTION_HEADING}>
              Looks
            </h3>
            <details className="border border-white/20">
              <summary className={DETAILS_SUMMARY}>Featured looks</summary>
              <div className="border-t border-white/20 p-3">
                <IdeasGallery hidePreserveToggle sectionLabel="Featured" />
              </div>
            </details>
            <PreserveTextToggle />
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="studio-tune-heading">
            <h3 id="studio-tune-heading" className={SECTION_HEADING}>
              Tune
            </h3>
            <SemanticSliderControls resetRef={semanticRef} />
            <details className="border border-white/20">
              <summary className={DETAILS_SUMMARY}>Formula glossary</summary>
              <div className="border-t border-white/20 p-3">
                <FormulaPanel />
              </div>
            </details>
          </section>

          <details className="border border-white/20">
            <summary className={DETAILS_SUMMARY}>Advanced controls</summary>
            <div className="flex flex-col gap-5 border-t border-white/20 p-3 pt-4">{advancedBody}</div>
          </details>
        </div>
      </aside>
    </>
  );
}
