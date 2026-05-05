import { useRef, useState, type ChangeEvent } from "react";
import { LayerEffectControls } from "@/components/controls/LayerEffectControls";
import { SliderControl } from "@/components/controls/SliderControl";
import { IdeasGallery } from "@/components/IdeasGallery";
import { UploadButton } from "@/components/UploadButton";
import { getSynthCanvas } from "@/constants/synthCanvas";
import { exportCanvasPng } from "@/lib/export/exportImage";
import { exportLoopWebm } from "@/lib/export/exportLoopWebm";
import {
  applySynthPreset,
  buildPreset,
  gatherPresetExportInput,
  parsePresetJson,
  presetToJson,
  PresetValidationError,
  validatePreset,
} from "@/lib/preset";
import { MAX_TEXT_LAYERS } from "@/store/textLayers";
import { useSynthStore } from "@/store/useSynthStore";

export function StackPanel() {
  const presetImportRef = useRef<HTMLInputElement>(null);
  const [includeImagesInPreset, setIncludeImagesInPreset] = useState(false);
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

  const exportPng = () => {
    const canvas = getSynthCanvas();
    if (canvas) exportCanvasPng(canvas, "image-editor.png", 1.5);
  };

  const exportWebm = async () => {
    const canvas = getSynthCanvas();
    if (canvas) await exportLoopWebm(canvas);
  };

  const getR3fCanvas = (): HTMLCanvasElement | null => getSynthCanvas();

  const copyPreset = async () => {
    const canvas = getR3fCanvas();
    if (!canvas) {
      window.alert("No canvas found.");
      return;
    }
    try {
      const input = await gatherPresetExportInput(canvas, includeImagesInPreset);
      const preset = buildPreset(input);
      const json = presetToJson(preset);
      await navigator.clipboard.writeText(json);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Copy failed.");
    }
  };

  const downloadPreset = async () => {
    const canvas = getR3fCanvas();
    if (!canvas) {
      window.alert("No canvas found.");
      return;
    }
    try {
      const input = await gatherPresetExportInput(canvas, includeImagesInPreset);
      const preset = buildPreset(input);
      const json = presetToJson(preset);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "synth-preset.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Download failed.");
    }
  };

  const onImportPreset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const raw = parsePresetJson(text);
      const preset = validatePreset(raw);
      await applySynthPreset(preset);
    } catch (e) {
      const msg = e instanceof PresetValidationError ? e.message : e instanceof Error ? e.message : "Import failed.";
      window.alert(msg);
    }
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

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-panel">
      <div className="flex shrink-0 items-center justify-between border-b border-white/20 p-4 pb-4">
        <h2 className="text-sm uppercase tracking-[0.25em]">The Stack</h2>
        <button
          type="button"
          className="border border-white px-2 py-1 text-[10px] uppercase tracking-widest"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          {panelOpen ? "Hide" : "Show"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-5">
        <IdeasGallery />
        <div className="flex w-full border border-white/25">
          {tabBtn("background", "Background", false)}
          {tabBtn("decal", "Decal", true)}
          {tabBtn("text", "Text", true)}
        </div>

        {stackTab === "background" ? (
          <>
            <UploadButton variant="background" />
            <LayerEffectControls layer="background" />
          </>
        ) : stackTab === "decal" ? (
          <>
            <UploadButton variant="decal" />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Placement
            </p>
            <SliderControl label="Decal Scale" min={0.1} max={4} value={decalScale} synthParam="decalScale" />
            <SliderControl
              label="Background × decal luminance"
              min={0}
              max={1}
              value={decalBackgroundLumaMask}
              synthParam="decalBackgroundLumaMask"
            />
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Blends from normal decal alpha-over (0) toward multiplying the background by the decal texture&apos;s
              luminance (1). Uses raw decal RGB before layer effects.
            </p>

            <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
              <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200">
                Link Decal to Distortion Math
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
              Drag on the canvas to move the decal (Background and Decal tabs). With a sticker and text, open the Text
              tab to drag the selected text layer separately.
            </p>

            <LayerEffectControls layer="decal" />
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Text layers</p>
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Stack order: first in the list is drawn below; last is on top. Multi-line and word wrap are supported.
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
                  <span className="text-zinc-300">Overlay text</span>
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
                        <span>Text Layer Scale</span>
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
                        Link Text to Distortion Math
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
                      label="Layer Scale"
                      min={0.1}
                      max={4}
                      value={decalScale}
                      synthParam="decalScale"
                    />
                    <div className="flex items-center justify-between gap-3 border border-white/20 px-3 py-3">
                      <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-zinc-200">
                        Link to Distortion Math
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
                      Without a decal image, all text layers share the same position and scale as the decal slot.
                      Upload a decal to unlock independent transforms per layer.
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
                  When linked, this layer uses the shared &quot;text&quot; effect preset below. Unlink to edit a
                  separate copy.
                </p>

                <p className="text-[10px] leading-relaxed text-zinc-500">
                  {hasDecalImage
                    ? "With this tab selected, drag on the canvas to move the selected text layer."
                    : "With this tab selected, drag on the canvas to move text (shared decal slot offset)."}
                </p>

                {selectedLayer.effectsLinked ? (
                  <LayerEffectControls layer="text" />
                ) : (
                  <LayerEffectControls layer="text" textSublayerId={selectedLayer.id} />
                )}
              </>
            ) : (
              <p className="text-[10px] text-zinc-500">Add a text layer to begin.</p>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-white/20 p-4 pt-4">
        <button
          type="button"
          className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
          onClick={exportPng}
        >
          Export PNG
        </button>
        <button
          type="button"
          className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
          onClick={exportWebm}
        >
          Export Loop WebM
        </button>

        <label className="flex cursor-pointer items-center gap-2 border border-white/20 px-3 py-2 text-[10px] uppercase tracking-wide text-zinc-300">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-white"
            checked={includeImagesInPreset}
            onChange={(e) => setIncludeImagesInPreset(e.target.checked)}
          />
          Include images in preset
        </label>

        <button
          type="button"
          className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
          onClick={() => void copyPreset()}
        >
          Copy preset
        </button>
        <button
          type="button"
          className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
          onClick={() => void downloadPreset()}
        >
          Download preset.json
        </button>

        <input
          ref={presetImportRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImportPreset}
        />
        <button
          type="button"
          className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
          onClick={() => presetImportRef.current?.click()}
        >
          Import preset
        </button>
      </div>
    </div>
  );
}
