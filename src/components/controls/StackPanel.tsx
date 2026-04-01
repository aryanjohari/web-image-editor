import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SliderControl } from "@/components/controls/SliderControl";
import { UploadButton } from "@/components/UploadButton";
import { exportCanvasPng } from "@/lib/export/exportImage";
import { exportLoopWebm } from "@/lib/export/exportLoopWebm";
import { useSynthStore } from "@/store/useSynthStore";

export function StackPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    panelOpen,
    setPanelOpen,
    stackTab,
    setStackTab,
    meltIntensity,
    colorBleed,
    noiseLevel,
    posterizeSteps,
    timeScale,
    maskCenterX,
    maskCenterY,
    maskRadius,
    twirlIntensity,
    colorA,
    colorB,
    duotoneBlend,
    colorCycleSpeed,
    halftoneIntensity,
    scanlineIntensity,
    overlayText,
    textColor,
    textSize,
    decalScale,
    decalTexture,
    linkDecalToMath,
    textScale,
    linkTextToMath,
    setParam,
  } = useSynthStore();

  useLayoutEffect(() => {
    if (!panelRef.current) return;
    gsap.to(panelRef.current, {
      xPercent: panelOpen ? 0 : 100,
      duration: 0.35,
      ease: "power2.out",
    });
  }, [panelOpen]);

  const exportPng = () => {
    const canvas = document.querySelector("canvas");
    if (canvas instanceof HTMLCanvasElement) exportCanvasPng(canvas, "image-editor.png", 1.5);
  };

  const exportWebm = async () => {
    const canvas = document.querySelector("canvas");
    if (canvas instanceof HTMLCanvasElement) await exportLoopWebm(canvas);
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
    <div ref={panelRef} className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-panel">
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
        <div className="flex w-full border border-white/25">
          {tabBtn("background", "Background", false)}
          {tabBtn("decal", "Decal", true)}
          {tabBtn("text", "Text", true)}
        </div>

        {stackTab === "background" ? (
          <>
            <UploadButton variant="background" />

            <SliderControl label="Melt Intensity" min={0} max={1} value={meltIntensity} synthParam="meltIntensity" />
            <SliderControl label="Color Bleed" min={0} max={1} value={colorBleed} synthParam="colorBleed" />
            <SliderControl label="Noise Level" min={0} max={0.5} value={noiseLevel} synthParam="noiseLevel" />
            <SliderControl
              label="Posterize Steps"
              min={2}
              max={24}
              step={1}
              value={posterizeSteps}
              synthParam="posterizeSteps"
            />
            <SliderControl label="Time Scale" min={0} max={3} value={timeScale} synthParam="timeScale" />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Mask
            </p>
            <SliderControl label="Mask Center X" min={0} max={1} value={maskCenterX} synthParam="maskCenterX" />
            <SliderControl label="Mask Center Y" min={0} max={1} value={maskCenterY} synthParam="maskCenterY" />
            <SliderControl label="Mask Radius" min={0} max={1} value={maskRadius} synthParam="maskRadius" />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Warp
            </p>
            <SliderControl
              label="Twirl Intensity"
              min={-20}
              max={20}
              value={twirlIntensity}
              synthParam="twirlIntensity"
            />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Duotone
            </p>
            <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
              <span className="text-zinc-300">Color A</span>
              <input
                type="color"
                className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
                value={colorA}
                onChange={(e) => setParam("colorA", e.target.value)}
              />
            </label>
            <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
              <span className="text-zinc-300">Color B</span>
              <input
                type="color"
                className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
                value={colorB}
                onChange={(e) => setParam("colorB", e.target.value)}
              />
            </label>
            <SliderControl label="Duotone Blend" min={0} max={1} value={duotoneBlend} synthParam="duotoneBlend" />
            <SliderControl
              label="Color Cycle Speed"
              min={0}
              max={5}
              value={colorCycleSpeed}
              synthParam="colorCycleSpeed"
            />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Textures
            </p>
            <SliderControl
              label="Halftone Intensity"
              min={0}
              max={1}
              value={halftoneIntensity}
              synthParam="halftoneIntensity"
            />
            <SliderControl
              label="Scanline Intensity"
              min={0}
              max={1}
              value={scanlineIntensity}
              synthParam="scanlineIntensity"
            />
          </>
        ) : stackTab === "decal" ? (
          <>
            <UploadButton variant="decal" />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Placement
            </p>
            <SliderControl label="Decal Scale" min={0.1} max={4} value={decalScale} synthParam="decalScale" />

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
              tab to drag the text layer separately.
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Text layer</p>
            <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
              <span className="text-zinc-300">Overlay Text</span>
              <input
                type="text"
                className="h-9 w-full border border-zinc-700 bg-zinc-900 px-2 text-sm normal-case tracking-normal text-white"
                value={overlayText}
                onChange={(e) => setParam("overlayText", e.target.value)}
                placeholder="Type text…"
              />
            </label>
            <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
              <span className="text-zinc-300">Text Color</span>
              <input
                type="color"
                className="h-9 w-full cursor-pointer border border-zinc-700 bg-zinc-900"
                value={textColor}
                onChange={(e) => setParam("textColor", e.target.value)}
              />
            </label>
            <SliderControl label="Text Size" min={24} max={320} value={textSize} synthParam="textSize" />

            <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Placement
            </p>
            {hasDecalImage ? (
              <>
                <SliderControl label="Text Layer Scale" min={0.1} max={4} value={textScale} synthParam="textScale" />
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
                  Without a decal image, text shares the same position and scale as the decal slot (same as before).
                  Upload a decal to unlock an independent text transform.
                </p>
              </>
            )}

            <p className="text-[10px] leading-relaxed text-zinc-500">
              {hasDecalImage
                ? "With this tab selected, drag on the canvas to move the text layer."
                : "With this tab selected, drag on the canvas to move text (same offset as the decal slot)."}
            </p>
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
      </div>
    </div>
  );
}
