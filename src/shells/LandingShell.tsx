import { Link } from "react-router-dom";
import { MoodInput } from "@/components/MoodInput";
import { SynthCanvasView } from "@/components/SynthCanvasView";
import { useLandingHero } from "@/hooks/useLandingHero";
import { usePresetFromUrl } from "@/hooks/usePresetFromUrl";

export function LandingShell() {
  const { isLoading } = useLandingHero();
  usePresetFromUrl({ enabled: !isLoading });

  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
      <SynthCanvasView />

      <div
        className={`pointer-events-none fixed inset-0 z-[60] flex flex-col items-start justify-between p-3 transition-opacity duration-300 ${
          isLoading ? "opacity-70" : "opacity-100"
        }`}
      >
        <Link
          to="/story"
          className="pointer-events-auto text-[9px] uppercase tracking-[0.18em] text-white/40 transition hover:text-white"
        >
          Case study
        </Link>
        <div className="flex flex-col items-start gap-2">
          <MoodInput disabled={isLoading} />
          <Link
            to="/lab"
            className="pointer-events-auto border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
          >
            Open Lab
          </Link>
        </div>
      </div>
    </main>
  );
}
