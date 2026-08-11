import { useRef } from "react";
import { FormulaPanel } from "@/components/controls/FormulaPanel";
import { LayerEffectControls } from "@/components/controls/LayerEffectControls";
import {
  SemanticSliderControls,
  type SemanticSliderControlsHandle,
} from "@/components/controls/SemanticSliderControls";
import { SliderControl } from "@/components/controls/SliderControl";
import { IdeasGallery } from "@/components/IdeasGallery";
import { PreserveTextToggle } from "@/components/PreserveTextToggle";
import { STUDIO_LAYER_TAB_LABELS } from "@/constants/studioLabels";
import { usePointerScrub } from "@/hooks/usePointerScrub";
import { MAX_TEXT_LAYERS } from "@/store/textLayers";
import { useSynthStore } from "@/store/useSynthStore";

const SECTION_HEADING = "text-sm font-medium text-stage-text";
const DETAILS_SUMMARY =
  "cursor-pointer list-none rounded-xl px-3 py-2.5 text-sm text-stage-text hover:bg-white/5 [&::-webkit-details-marker]:hidden";

export type StudioDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Soft Tune floating card — semantic sliders + light looks.
 * Hides entirely while pointer-scrubbing so the canvas preview stays full-bleed.
 * Advanced banks / formula stay collapsed away from the primary surface.
 */
export function StudioDrawer({ open, onClose }: StudioDrawerProps) {
  const semanticRef = useRef<SemanticSliderControlsHandle | null>(null);
  const { isScrubbing, onScrubStart, onScrubEnd } = usePointerScrub();

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
      className={`flex-1 py-2.5 text-xs transition-colors sm:text-sm ${
        showLeftBorder ? "border-l border-stage-border" : ""
      } ${
        stackTab === id
          ? "bg-stage-text text-stage-bg"
          : "text-stage-muted hover:bg-white/5 hover:text-stage-text"
      }`}
      onClick={() => setStackTab(id)}
    >
      {label}
    </button>
  );

  const advancedBody = (
    <>
      <div className="flex w-full overflow-hidden rounded-xl border border-stage-border">
        {tabBtn("background", STUDIO_LAYER_TAB_LABELS.background, false)}
        {tabBtn("decal", STUDIO_LAYER_TAB_LABELS.decal, true)}
        {tabBtn("text", STUDIO_LAYER_TAB_LABELS.text, true)}
      </div>

      {stackTab === "background" ? (
        <>
          <p className="text-sm leading-relaxed text-stage-muted">
            Set the hero from Workspace → Assets.
          </p>
          <LayerEffectControls layer="background" />
        </>
      ) : stackTab === "decal" ? (
        <>
          <p className="text-sm leading-relaxed text-stage-muted">
            Set the overlay from Workspace → Assets (PNG / WebP).
          </p>
          <p className="border-t border-stage-border pt-4 text-xs font-medium text-stage-muted">
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

  const scrubbing = open && isScrubbing;
  /** Fade chrome only — keep layout so the active thumb does not jump mid-drag. */
  const chromeClass = scrubbing ? "pointer-events-none opacity-0" : "opacity-100";

  return (
    <aside
      id="studio-looks-drawer"
      role="dialog"
      aria-modal={false}
      aria-labelledby="studio-tune-title"
      className={`stage-drawer-motion pointer-events-none fixed bottom-4 right-4 left-auto top-auto z-[55] flex max-h-[min(70dvh,36rem)] w-[min(100vw-1.5rem,22rem)] flex-col rounded-2xl ${
        open ? "" : "invisible opacity-0"
      } ${
        scrubbing
          ? "border border-transparent bg-transparent shadow-none backdrop-blur-none"
          : "border border-stage-border bg-stage-panel/92 shadow-stage backdrop-blur-md"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`flex min-h-0 flex-1 flex-col ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`stage-drawer-motion flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 ${
            scrubbing ? "border-transparent" : "border-stage-border"
          } ${chromeClass}`}
          aria-hidden={scrubbing}
        >
          <h2 id="studio-tune-title" className="text-base font-medium text-stage-text">
            Tune
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={scrubbing ? -1 : undefined}
              className="rounded-xl border border-stage-border px-3 py-1.5 text-sm text-stage-muted transition hover:bg-stage-elevated hover:text-stage-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
              onClick={() => semanticRef.current?.resetToDefaults()}
            >
              Reset
            </button>
            <button
              type="button"
              tabIndex={scrubbing ? -1 : undefined}
              className="rounded-xl border border-stage-border px-3 py-1.5 text-sm text-stage-text transition hover:bg-stage-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <p
            className={`stage-drawer-motion text-sm leading-relaxed text-stage-muted ${chromeClass}`}
            aria-hidden={scrubbing}
          >
            Drag sliders — chrome hides so you can see the canvas.
          </p>

          {/* Soft plate so sliders stay readable; pad is constant to avoid thumb jump */}
          <section
            className={`flex flex-col gap-3 rounded-2xl border p-3 ${
              scrubbing
                ? "border-stage-border/60 bg-stage-panel/80 shadow-stage backdrop-blur-md"
                : "border-transparent"
            }`}
            aria-labelledby="studio-tune-sliders"
          >
            <h3
              id="studio-tune-sliders"
              className={`stage-drawer-motion ${SECTION_HEADING} ${chromeClass}`}
              aria-hidden={scrubbing}
            >
              Intensity · Motion · Grit
            </h3>
            <SemanticSliderControls
              resetRef={semanticRef}
              tone="stage"
              onScrubStart={onScrubStart}
              onScrubEnd={onScrubEnd}
            />
          </section>

          <details
            className={`stage-drawer-motion rounded-2xl border border-stage-border ${chromeClass}`}
            aria-hidden={scrubbing}
          >
            <summary className={DETAILS_SUMMARY} tabIndex={scrubbing ? -1 : undefined}>
              Looks
            </summary>
            <div className="flex flex-col gap-3 border-t border-stage-border p-3">
              <PreserveTextToggle />
              <IdeasGallery hidePreserveToggle sectionLabel="Featured" />
            </div>
          </details>

          <details
            className={`stage-drawer-motion rounded-2xl border border-stage-border ${chromeClass}`}
            aria-hidden={scrubbing}
          >
            <summary className={DETAILS_SUMMARY} tabIndex={scrubbing ? -1 : undefined}>
              Advanced
            </summary>
            <div className="flex flex-col gap-5 border-t border-stage-border p-3 pt-4">
              <details className="rounded-xl border border-stage-border">
                <summary className={DETAILS_SUMMARY}>Formula glossary</summary>
                <div className="border-t border-stage-border p-3">
                  <FormulaPanel />
                </div>
              </details>
              {advancedBody}
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}
