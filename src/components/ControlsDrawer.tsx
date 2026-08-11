/**
 * @deprecated StudioShell uses AppNav + StudioDrawer; library is `/workspace`.
 * Kept for accidental imports; opens StudioDrawer-shaped panel via StackPanel alias.
 */
import { useState } from "react";
import { StudioDrawer } from "@/components/lab/StudioDrawer";

export function ControlsDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="fixed right-3 top-3 z-[60] border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? "Close" : "Studio"}
      </button>
      <StudioDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
