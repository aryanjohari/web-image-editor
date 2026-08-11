/**
 * /embed-demo — live StageRecipe behind HTML (Phase 5).
 */

import { Link } from "react-router-dom";
import { getPresetById } from "@/data/presetCatalog";
import { StageEmbedBackground, STAGE_EMBED_SNIPPET } from "@/lib/stage/embed";
import { synthPresetV2ToStageRecipe } from "@/lib/stage";

const navLinkClass =
  "border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black focus:outline-none focus:ring-1 focus:ring-white/50";

function buildDemoRecipe() {
  const entry = getPresetById("soft-drift") ?? getPresetById("night-gradient");
  if (!entry) throw new Error("Catalog preset missing for embed demo");
  const r = synthPresetV2ToStageRecipe(entry.preset);
  r.meta = { ...(r.meta ?? {}), title: entry.label, source: "embed-demo" };
  return r;
}

const DEMO_RECIPE = buildDemoRecipe();

export function EmbedDemoShell() {
  return (
    <div className="relative min-h-dvh bg-black text-white">
      <StageEmbedBackground recipe={DEMO_RECIPE} />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 md:px-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">Stage · embed demo</p>
          <nav className="flex flex-wrap gap-2">
            <Link to="/" className={navLinkClass}>
              Home
            </Link>
            <Link to="/lab" className={navLinkClass}>
              Lab
            </Link>
            <Link to="/story" className={navLinkClass}>
              Story
            </Link>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-5 pb-16 pt-8 md:px-8">
          <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            Live recipe behind your HTML
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            This page loads a bundled StageRecipe (Soft Drift), applies it to the WebGL compositor, and
            keeps content in the DOM above a <code className="text-white/90">pointer-events: none</code>{" "}
            canvas. Respects <code className="text-white/90">prefers-reduced-motion</code> by freezing
            time-driven uniforms.
          </p>
          <p className="text-xs text-white/55">
            Details: <code className="text-white/70">src/lib/stage/EMBED.md</code>
          </p>

          <pre className="overflow-x-auto rounded-sm border border-white/20 bg-black/75 p-4 text-[11px] leading-relaxed text-white/85 backdrop-blur-sm">
            {STAGE_EMBED_SNIPPET}
          </pre>
        </main>
      </div>
    </div>
  );
}
