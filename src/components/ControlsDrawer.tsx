import { StackPanel } from "@/components/controls/StackPanel";
import { useSynthStore } from "@/store/useSynthStore";

/**
 * Full-width canvas shell: stack lives in a fixed overlay. Hover the right edge (md+)
 * or use the Studio button to open; close from the button or the panel header.
 */
export function ControlsDrawer() {
  const panelOpen = useSynthStore((s) => s.panelOpen);
  const setPanelOpen = useSynthStore((s) => s.setPanelOpen);

  return (
    <>
      <button
        type="button"
        className="fixed right-3 top-3 z-[60] border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
        onClick={() => setPanelOpen(!panelOpen)}
        aria-expanded={panelOpen}
        aria-label={panelOpen ? "Close Background Studio panel" : "Open Background Studio panel"}
      >
        {panelOpen ? "Close" : "Studio"}
      </button>

      {!panelOpen ? (
        <div
          className="pointer-events-auto fixed right-0 top-0 z-[55] hidden h-full w-5 md:block"
          aria-hidden
          title=""
          onMouseEnter={() => setPanelOpen(true)}
        />
      ) : null}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100vw,360px)] max-w-full flex-col border-l border-white/20 bg-panel/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out ${
          panelOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <StackPanel />
      </div>
    </>
  );
}
