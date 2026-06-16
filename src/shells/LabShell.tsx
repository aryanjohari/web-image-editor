import { ControlsDrawer } from "@/components/ControlsDrawer";
import { IdeasGallery } from "@/components/IdeasGallery";
import { SynthCanvasView } from "@/components/SynthCanvasView";
import { usePresetFromUrl } from "@/hooks/usePresetFromUrl";

export function LabShell() {
  usePresetFromUrl();
  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
      <SynthCanvasView />

      <details className="fixed left-3 top-3 z-[60] max-w-[min(calc(100vw-1.5rem),220px)] border border-white/35 bg-black/80 backdrop-blur-sm [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/10">
          Ideas
        </summary>
        <div className="max-h-[min(70dvh,28rem)] overflow-y-auto overflow-x-hidden border-t border-white/20 p-2">
          <IdeasGallery variant="dropdown" />
        </div>
      </details>

      <ControlsDrawer />
    </main>
  );
}
