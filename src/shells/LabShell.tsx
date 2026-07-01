import { useEffect } from "react";
import { ControlsDrawer } from "@/components/ControlsDrawer";
import { SynthCanvasView } from "@/components/SynthCanvasView";
import { usePresetFromUrl } from "@/hooks/usePresetFromUrl";
import { useSynthStore } from "@/store/useSynthStore";

export function LabShell() {
  usePresetFromUrl();

  useEffect(() => {
    useSynthStore.getState().setPanelOpen(true);
  }, []);
  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
      <SynthCanvasView />
      <ControlsDrawer />
    </main>
  );
}
