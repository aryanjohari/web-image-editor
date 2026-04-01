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
      <UploadButton />

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

      <p className="border-t border-white/20 pt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        Text
      </p>
      <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-wide">
        <span className="text-zinc-300">Overlay Text</span>
        <input
          type="text"
          className="h-9 w-full border border-zinc-700 bg-zinc-900 px-2 text-sm normal-case tracking-normal text-white"
          value={overlayText}
          onChange={(e) => setParam("overlayText", e.target.value)}
          placeholder="Type text..."
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
