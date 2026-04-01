import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SliderControl } from "@/components/controls/SliderControl";
import { UploadButton } from "@/components/UploadButton";
import { exportCanvasPng } from "@/lib/export/exportImage";
import { exportLoopWebm } from "@/lib/export/exportLoopWebm";
import { useSynthStore } from "@/store/useSynthStore";

export function StackPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const { panelOpen, setPanelOpen, meltIntensity, colorBleed, noiseLevel, posterizeSteps, timeScale } =
    useSynthStore();

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
    <div ref={panelRef} className="flex h-full w-[320px] flex-col gap-5 bg-panel p-4">
      <div className="flex items-center justify-between border-b border-white/20 pb-4">
        <h2 className="text-sm uppercase tracking-[0.25em]">The Stack</h2>
        <button
          type="button"
          className="border border-white px-2 py-1 text-[10px] uppercase tracking-widest"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          {panelOpen ? "Hide" : "Show"}
        </button>
      </div>

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

      <div className="mt-auto flex flex-col gap-2">
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
