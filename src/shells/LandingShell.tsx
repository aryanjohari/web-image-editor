import { Link } from "react-router-dom";
import { SynthCanvasView } from "@/components/SynthCanvasView";

export function LandingShell() {
  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
      <SynthCanvasView />

      <div className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-start justify-between p-3">
        <p className="pointer-events-auto text-[10px] uppercase tracking-[0.22em] text-white/80">
          The Algorithm Engine
        </p>
        <Link
          to="/lab"
          className="pointer-events-auto border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
        >
          Open Lab
        </Link>
      </div>
    </main>
  );
}
