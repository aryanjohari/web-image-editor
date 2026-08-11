import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExportActions } from "@/components/controls/ExportActions";
import { FloatingBrief } from "@/components/lab/FloatingBrief";
import { StudioDrawer } from "@/components/lab/StudioDrawer";
import { AppNav } from "@/components/shell/AppNav";
import { SynthCanvasView } from "@/components/SynthCanvasView";
import { usePresetFromUrl } from "@/hooks/usePresetFromUrl";
import { ensureWorkspaceMigrated, getActiveBrand, subscribeWorkspace } from "@/lib/stage/workspace";
import { useSynthStore } from "@/store/useSynthStore";

const chipBtn =
  "rounded-xl border border-stage-border bg-stage-panel/90 px-3 py-1.5 text-sm text-stage-text backdrop-blur-md transition hover:border-stage-accent/40 hover:bg-stage-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]";

/**
 * Studio — full-bleed canvas + thin nav + Tune overlay + floating brief + export.
 */
export function StudioShell() {
  usePresetFromUrl();
  const [panelOpen, setTuneOpen] = useState(false);
  const [activeBrandName, setActiveBrandName] = useState<string | null>(null);
  const setPanelOpen = useSynthStore((s) => s.setPanelOpen);
  const hasHero = useSynthStore((s) => s.imageTexture != null);

  useEffect(() => {
    setPanelOpen(false);
    void ensureWorkspaceMigrated().catch((e) => {
      console.warn("[StudioShell] workspace migrate", e);
    });
  }, [setPanelOpen]);

  useEffect(() => {
    const refreshChip = () => {
      void getActiveBrand().then((b) => setActiveBrandName(b?.name?.trim() || null));
    };
    refreshChip();
    return subscribeWorkspace(refreshChip);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTuneOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-stage-canvas font-stage text-stage-text">
      <SynthCanvasView />
      <AppNav
        variant="studio"
        meta={
          <span className="max-w-[10rem] truncate rounded-lg border border-stage-border bg-black/40 px-2 py-1 text-xs text-stage-muted">
            {activeBrandName ? activeBrandName : "No active brand"}
            {hasHero ? " · Hero set" : ""}
          </span>
        }
        trailing={
          <>
            <Link to="/workspace" className={`${chipBtn} no-underline`}>
              Workspace
            </Link>
            <ExportActions variant="menu" />
            <button
              type="button"
              className={chipBtn}
              aria-expanded={panelOpen}
              aria-controls="studio-looks-drawer"
              onClick={() => setTuneOpen((o) => !o)}
            >
              {panelOpen ? "Close Tune" : "Tune"}
            </button>
          </>
        }
      />
      <StudioDrawer open={panelOpen} onClose={() => setTuneOpen(false)} />
      <FloatingBrief />
    </main>
  );
}
