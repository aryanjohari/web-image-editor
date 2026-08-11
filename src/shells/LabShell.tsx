import { useEffect, useState } from "react";
import { FloatingBrief } from "@/components/lab/FloatingBrief";
import { LabTopBar } from "@/components/lab/LabTopBar";
import { LibraryDrawer } from "@/components/lab/LibraryDrawer";
import { StudioDrawer } from "@/components/lab/StudioDrawer";
import { SynthCanvasView } from "@/components/SynthCanvasView";
import { usePresetFromUrl } from "@/hooks/usePresetFromUrl";
import { ensureWorkspaceMigrated } from "@/lib/stage/workspace";
import { useSynthStore } from "@/store/useSynthStore";

/**
 * Lab — full-bleed canvas + Library (left) + Studio (right) + floating brief + export menu.
 */
export function LabShell() {
  usePresetFromUrl();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const setPanelOpen = useSynthStore((s) => s.setPanelOpen);

  useEffect(() => {
    // Keep legacy panel flag closed — chrome is Library/Studio drawers now.
    setPanelOpen(false);
    void ensureWorkspaceMigrated().catch((e) => {
      console.warn("[LabShell] workspace migrate", e);
    });
  }, [setPanelOpen]);

  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
      <SynthCanvasView />
      <LabTopBar
        libraryOpen={libraryOpen}
        studioOpen={studioOpen}
        onToggleLibrary={() => {
          setLibraryOpen((o) => !o);
          setStudioOpen(false);
        }}
        onToggleStudio={() => {
          setStudioOpen((o) => !o);
          setLibraryOpen(false);
        }}
      />
      <LibraryDrawer open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <StudioDrawer open={studioOpen} onClose={() => setStudioOpen(false)} />
      <FloatingBrief />
    </main>
  );
}
