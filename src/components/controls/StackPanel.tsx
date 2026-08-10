import { useRef } from "react";
import { ExportActions } from "@/components/controls/ExportActions";
import { FormulaPanel } from "@/components/controls/FormulaPanel";
import { LayerEffectControls } from "@/components/controls/LayerEffectControls";
import { SemanticSliderControls, type SemanticSliderControlsHandle } from "@/components/controls/SemanticSliderControls";
import { SliderControl } from "@/components/controls/SliderControl";
import { IdeasGallery } from "@/components/IdeasGallery";
import { MoodInput } from "@/components/MoodInput";
import { PreserveTextToggle } from "@/components/PreserveTextToggle";
import { StageAssetList } from "@/components/StageAssetList";
import { UploadButton } from "@/components/UploadButton";
import { STUDIO_LAYER_TAB_LABELS } from "@/constants/studioLabels";
import { MAX_TEXT_LAYERS } from "@/store/textLayers";
import { useSynthStore } from "@/store/useSynthStore";

const SECTION_HEADING =
  "text-[10px] uppercase tracking-[0.2em] text-zinc-400";

const DETAILS_SUMMARY =
  "cursor-pointer list-none px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-300 hover:bg-white/5 [&::-webkit-details-marker]:hidden";

const EXPORT_INTRO =
  "Preset JSON is the primary deliverable for embedding on your site. WebM and PNG are optional demo or fallback exports.";

export function StackPanel() {
  const semanticRef = useRef<SemanticSliderControlsHandle | null>(null);

  const {
    panelOpen,
    setPanelOpen,
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

  const resetSemanticSliders = () => {
    semanticRef.current?.resetToDefaults();
  };

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

  const hasDecalImage = decalTexture != null;

  const advancedBody = (
    <>
      <div className="flex w-full border border-white/25">
        {tabBtn("background", STUDIO_LAYER_TAB_LABELS.background, false)}
        {tabBtn("decal", STUDIO_LAYER_TAB_LABELS.decal, true)}
        {tabBtn("text", STUDIO_LAYER_TAB_LABELS.text, true)}
      </div>

      {stackTab === "background" ? (
        <>
          <p className="text-[10px] leading-relaxed text-zinc-500">Upload in Source above.</p>
          <LayerEffectControls layer="background" />
        </>
      ) : stackTab === "decal" ? (
        <>
          <UploadButton variant="decal" />

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
          <p className="text-[10px] leading-relaxed text-zinc-500">
            At 0, normal overlay blend. At 1, multiply hero brightness by overlay luminance (raw overlay RGB, before
            effects).
          </p>

          <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
            <span
              className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200"
              title="Overlay warps with the same UV distortion as the hero texture."
            >
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

          <p className="text-[10px] leading-relaxed text-zinc-500">
            Drag on the canvas to move the overlay (Hero texture or Overlay tab). With preview text, open the Preview
            text tab to drag the selected layer separately.
          </p>

          <LayerEffectControls layer="decal" />
        </>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{STUDIO_LAYER_TAB_LABELS.text}</p>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Lab-only headline for layout preview — use HTML above the canvas on your site. Layer order: first in the
            list is drawn below; last is on top. Multi-line and word wrap are supported.
          </p>

          <div className="flex flex-wrap gap-2">
            {textLayers.map((l, idx) => (
              <button
                key={l.id}
                type="button"
                className={`border px-2 py-1 text-[10px] uppercase tracking-wide ${
                  selectedTextLayerId === l.id ? "border-white bg-white text-black" : "border-white/25 text-zinc-300"
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
                  rows={5}
                  className="min-h-[5rem] w-full resize-y border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm normal-case tracking-normal text-white"
                  value={selectedLayer.text}
                  onChange={(e) => updateTextLayer(selectedLayer.id, { text: e.target.value })}
                  placeholder="Type text… (line breaks allowed)"
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

              <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Placement
              </p>
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
                    <span
                      className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200"
                      title="Preview text warps with the same UV distortion as the hero texture."
                    >
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
                    <span
                      className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200"
                      title="Preview text warps with the same UV distortion as the hero texture."
                    >
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
                  <p className="text-[10px] leading-relaxed text-zinc-500">
                    Without an overlay, all preview text layers share one position and scale. Upload an overlay to unlock
                    per-layer placement.
                  </p>
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
              <p className="text-[10px] leading-relaxed text-zinc-500">
                When linked, this layer uses the shared preview text effect preset below. Unlink to edit a separate
                copy.
              </p>

              <p className="text-[10px] leading-relaxed text-zinc-500">
                {hasDecalImage
                  ? "With this tab selected, drag on the canvas to move the selected preview text layer."
                  : "With this tab selected, drag on the canvas to move preview text (shared overlay placement)."}
              </p>

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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-panel">
      <div className="flex shrink-0 items-center justify-between border-b border-white/20 p-4 pb-4">
        <h2 className="text-sm uppercase tracking-[0.25em]">Background Studio</h2>
        <button
          type="button"
          className="border border-white px-2 py-1 text-[10px] uppercase tracking-widest"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          {panelOpen ? "Hide" : "Show"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-5">
        <section aria-labelledby="studio-source-heading" className="flex flex-col gap-3">
          <h3 id="studio-source-heading" className={SECTION_HEADING}>
            Source
          </h3>
          <StageAssetList />
        </section>

        <section aria-labelledby="studio-look-heading" className="flex flex-col gap-3">
          <h3 id="studio-look-heading" className={SECTION_HEADING}>
            Look
          </h3>
          <IdeasGallery hidePreserveToggle sectionLabel="Background looks" />
          <PreserveTextToggle />
          <MoodInput
            variant="lab"
            showPreserveToggle={false}
            onMoodApplied={resetSemanticSliders}
          />
        </section>

        <section aria-labelledby="studio-tune-heading" className="flex flex-col gap-3">
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

        <section aria-labelledby="studio-export-heading" className="flex flex-col gap-2">
          <h3 id="studio-export-heading" className={SECTION_HEADING}>
            Export
          </h3>
          <p className="text-[10px] leading-relaxed text-zinc-500">{EXPORT_INTRO}</p>
        </section>

        <details className="border border-white/20">
          <summary className={DETAILS_SUMMARY}>Advanced controls</summary>
          <div className="flex flex-col gap-5 border-t border-white/20 p-3 pt-4">{advancedBody}</div>
        </details>
      </div>

      <ExportActions />
    </div>
  );
}
