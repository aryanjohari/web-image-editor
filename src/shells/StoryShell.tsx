import { Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/aryanjohari/web-image-editor";

const navLinkClass =
  "border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black focus:outline-none focus:ring-1 focus:ring-white/50";

const PRESET_EXAMPLE = `{
  "presetSchemaVersion": 2,
  "engineVersion": "0.0.0",
  "synth": {
    "decalScale": 1,
    "decalOffsetX": 0,
    "decalOffsetY": 0,
    "decalBackgroundLumaMask": 0,
    "linkDecalToMath": false,
    "linkTextToMath": false,
    "textLayers": [
      {
        "id": "preset-bg-soft-drift",
        "text": "",
        "color": "#e8e8e8",
        "fontSize": 48,
        "offsetX": 0,
        "offsetY": 0,
        "scale": 1,
        "effectsLinked": true
      }
    ],
    "selectedTextLayerId": "preset-bg-soft-drift",
    "textLayerEffects": {}
  },
  "layerEffects": {
    "background": {
      "meltIntensity": 0.12,
      "colorBleed": 0.32,
      "noiseLevel": 0.02,
      "posterizeSteps": 12,
      "timeScale": 0.5,
      "twirlIntensity": 0.05,
      "colorA": "#1a2030",
      "colorB": "#8a9cb8",
      "duotoneBlend": 0.55,
      "colorCycleSpeed": 0.04,
      "scanlineIntensity": 0,
      "halftoneIntensity": 0
    },
    "decal": { "meltIntensity": 0.04, "colorBleed": 0.12, "timeScale": 0.45 },
    "text": { "meltIntensity": 0, "colorBleed": 0.1, "timeScale": 0.4 }
  },
  "imageResolution": { "width": 1920, "height": 1080 },
  "viewport": {
    "drawBufferWidth": 1920,
    "drawBufferHeight": 1080,
    "cssWidth": 960,
    "cssHeight": 540,
    "dpr": 2
  },
  "baseTimeSeconds": 0
}`;

const PIPELINE_DIAGRAM = `optional hero texture (PNG/JPEG/WebP)
  → Zustand store (hero texture, overlay, layerEffects, preview text)
  → SynthMaterial uniforms (L0 / L1 / T0–T3)
  → fragment.glsl (warp → sample → shade → composite)
  → full-viewport canvas (behind your HTML on real sites)

mood / AI
  → basePresetId + optional patch
  → applyStylePreset + applyPresetPatch
  → same hero texture, new look coefficients

export (Background Studio → Export)
  → JSON  (primary — embed on your site)
  → WebM  (motion demo / social loop)
  → PNG   (poster / prefers-reduced-motion fallback)`;

const EMBED_DIAGRAM = `preset JSON  ──►  WebGL canvas  (fixed inset-0, z-index 0)
                         │
HTML content ────────────┴──►  user sees site  (headlines, nav, CTAs in DOM)`;

function StoryNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/35 bg-black/90 px-4 py-3 backdrop-blur-sm"
      aria-label="Site navigation"
    >
      <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">
        Background Studio
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/" className={navLinkClass}>
          Home
        </Link>
        <Link to="/studio" className={navLinkClass}>
          Open Studio
        </Link>
        <Link to="/embed-demo" className={navLinkClass}>
          Embed demo
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={navLinkClass}
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded border border-white/20 bg-zinc-950 p-4 text-xs font-mono leading-relaxed text-zinc-200">
      {children}
    </pre>
  );
}

export function StoryShell() {
  return (
    <main className="min-h-screen overflow-y-auto bg-black text-white">
      <StoryNav />

      <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* A. Hero */}
        <header className="mb-12 border-b border-white/20 pb-10">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Background Studio
          </h1>
          <p className="mb-4 text-[11px] uppercase tracking-[0.14em] text-white/50">
            The Algorithm Engine
          </p>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300 md:text-base">
            A browser-based live hero background creator: design ambient,
            full-viewport animated backgrounds, export preset JSON, and embed the
            same shader on a real site — canvas behind HTML, coefficients as the
            portable contract. Optional hero texture and overlay; preview text in
            the lab only.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={navLinkClass}>
              Try /
            </Link>
            <Link to="/studio" className={navLinkClass}>
              Open Studio
            </Link>
          </div>
        </header>

        {/* B. Problem & thesis */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Problem &amp; thesis
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            Landing pages need ambient, performant hero backgrounds without baking
            video or round-tripping through desktop compositing software.
            Generative AI gives you new pixels every time; Background Studio gives
            you reproducible looks — explicit numeric coefficients you can save,
            share, and replay on any site that implements the same shader
            contract. One single-pass WebGL compositor composites hero texture,
            optional overlay, and up to four preview text slots in one fragment
            program.
          </p>
        </section>

        {/* C. How it embeds */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            How it embeds
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            On a production site, a full-viewport WebGL canvas sits{" "}
            <strong className="font-medium text-white">behind</strong> your HTML
            content. Preset JSON drives the shader; headlines, navigation, and
            CTAs live in the DOM — not in{" "}
            <code className="text-zinc-200">synth.textLayers</code>. The lab uses
            GPU preview text only to mock layout; real sites use HTML above the
            canvas.
          </p>
          <CodeBlock>{EMBED_DIAGRAM}</CodeBlock>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            Typical stack: canvas container{" "}
            <code className="text-zinc-200">position: fixed; inset: 0; z-index: 0</code>{" "}
            with <code className="text-zinc-200">pointer-events: none</code> so
            clicks pass through; page content at{" "}
            <code className="text-zinc-200">position: relative; z-index: 1</code>.
            Step-by-step layout and load sequence:{" "}
            <code className="text-zinc-200">src/lib/preset/PORTING.md</code>.
          </p>
        </section>

        {/* D. Pipeline */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Pipeline
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            End-to-end flow from optional hero texture to export:
          </p>
          <CodeBlock>{PIPELINE_DIAGRAM}</CodeBlock>
        </section>

        {/* E. Single-pass shader */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Single-pass shader tradeoff
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            One draw call per frame: hero texture → overlay → preview text slots,
            all in{" "}
            <code className="text-zinc-200">src/webgl/shaders/fragment.glsl</code>
            . Each logical layer gets its own uniform bank —{" "}
            <code className="text-zinc-200">L0</code> (hero texture),{" "}
            <code className="text-zinc-200">L1</code> (overlay),{" "}
            <code className="text-zinc-200">T0–T3</code> (preview text) — so melt,
            duotone, scanlines, and time can diverge per layer while staying in
            one program.
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            The per-pixel path is warp → sample → shade → composite. For the
            formula glossary (warp vs matrix vs composite), see{" "}
            <code className="text-zinc-200">MATH.md</code> in the repo. Background
            Studio{" "}
            <strong className="font-medium text-white">Formula glossary</strong> (
            <code className="text-zinc-200">/studio</code> → Looks → Formula glossary)
            exposes the same coefficients with live sliders via{" "}
            <code className="text-zinc-200">src/data/formulaCatalog.ts</code>.
          </p>
        </section>

        {/* F. Preset JSON */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Preset JSON (v2)
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            Presets are schema version{" "}
            <code className="text-zinc-200">2</code> (
            <code className="text-zinc-200">PRESET_SCHEMA_VERSION</code> in{" "}
            <code className="text-zinc-200">src/lib/preset/types.ts</code>).
            The background looks catalog has{" "}
            <strong className="font-medium text-white">7 featured</strong> ambient
            presets (e.g.{" "}
            <code className="text-zinc-200">soft-drift</code>,{" "}
            <code className="text-zinc-200">film-grain</code>,{" "}
            <code className="text-zinc-200">archive</code>) plus{" "}
            <strong className="font-medium text-white">7 legacy</strong> expressive
            looks under <strong className="font-medium text-white">More looks</strong>{" "}
            in{" "}
            <code className="text-zinc-200">src/data/presetCatalog.ts</code>.
            Featured entries are style-only — no embedded{" "}
            <code className="text-zinc-200">assets</code>. Trimmed example from
            Soft Drift:
          </p>
          <CodeBlock>{PRESET_EXAMPLE}</CodeBlock>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            Share a catalog look via{" "}
            <code className="text-zinc-200">/studio?preset=soft-drift</code> (ids in{" "}
            <code className="text-zinc-200">src/data/presetCatalog.ts</code>).
            Key fields: <code className="text-zinc-200">layerEffects</code> per
            layer; <code className="text-zinc-200">synth.textLayers</code> for lab
            preview only — omit or ignore on production background embeds.
            Production sites supply a hero texture URL separately or grade a
            site-owned plate. To embed this preset format elsewhere, see{" "}
            <code className="text-zinc-200">src/lib/preset/PORTING.md</code>.
          </p>
        </section>

        {/* G. Apply modes */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Apply modes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-white/20 text-left text-[10px] uppercase tracking-[0.12em] text-white/60">
                  <th className="py-2 pr-4 font-medium">Mode</th>
                  <th className="py-2 pr-4 font-medium">Function</th>
                  <th className="py-2 pr-4 font-medium">Touches uploads?</th>
                  <th className="py-2 font-medium">Use case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4 font-medium text-white">Full</td>
                  <td className="py-2 pr-4">
                    <code className="text-xs">applySynthPreset</code>
                  </td>
                  <td className="py-2 pr-4">Yes, if preset has assets</td>
                  <td className="py-2">
                    Background Studio JSON import with embedded hero/overlay assets
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4 font-medium text-white">Style</td>
                  <td className="py-2 pr-4">
                    <code className="text-xs">applyStylePreset</code>
                  </td>
                  <td className="py-2 pr-4">Never</td>
                  <td className="py-2">
                    Landing hero, full look when Keep preview text is off
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4 font-medium text-white">Effects</td>
                  <td className="py-2 pr-4">
                    <code className="text-xs">applyEffectsOnlyFromPreset</code>
                  </td>
                  <td className="py-2 pr-4">Never</td>
                  <td className="py-2">
                    Background looks, mood, URL preset when Keep preview text is on
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-white">Patch</td>
                  <td className="py-2 pr-4">
                    <code className="text-xs">applyPresetPatch</code>
                  </td>
                  <td className="py-2 pr-4">Never</td>
                  <td className="py-2">Mood nudges, AI output, slider tweaks</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            <strong className="font-medium text-white">Keep preview text</strong>{" "}
            (default on) applies background looks and mood without replacing your
            preview copy. Mood (keywords + optional AI) always composes style then
            patch — it never replaces your hero texture.
          </p>
        </section>

        {/* H. Exports */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Exports
          </h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-300 md:text-base">
            <li>
              <strong className="font-medium text-white">JSON</strong> — primary
              deliverable: preset coefficients for git, sharing, and embedding on
              your site via the shader contract.
            </li>
            <li>
              <strong className="font-medium text-white">WebM</strong> — short
              looping clip for motion demos and social when melt, color cycle, or
              scanlines matter.
            </li>
            <li>
              <strong className="font-medium text-white">PNG</strong> — still
              poster frame for thumbnails or{" "}
              <code className="text-zinc-200">prefers-reduced-motion</code>{" "}
              fallback on production sites.
            </li>
          </ul>
        </section>

        {/* I. What AI does / doesn't */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            What AI does / doesn&apos;t do
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-zinc-300 md:text-base">
            <strong className="font-medium text-white">Does:</strong> pick a
            catalog preset id and optional numeric patch (
            <code className="text-zinc-200">basePresetId</code> +{" "}
            <code className="text-zinc-200">patch</code>) via{" "}
            <code className="text-zinc-200">/api/mood</code> when{" "}
            <code className="text-zinc-200">VITE_MOOD_AI_ENABLED=true</code>.
            For ambient and site-background requests, prefers{" "}
            <strong className="font-medium text-white">featured</strong> presets
            (soft-drift, film-grain, night-gradient, archive, soft-bloom,
            sunset-melt, clean-loop) unless the mood explicitly asks for glitch,
            neon, or punk aesthetics.
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            <strong className="font-medium text-white">Doesn&apos;t:</strong>{" "}
            generate images or full preset files. When AI is off or unreachable,
            keyword mood mapping (
            <code className="text-zinc-200">mapMoodToPreset</code>) applies the
            same style + patch pipeline with the same featured-first tie-break.
          </p>
        </section>

        {/* J. Tech stack */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Tech stack
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300 md:text-base">
            <li>React 19 + Vite 8 + TypeScript</li>
            <li>React Three Fiber + Three.js + @react-three/drei</li>
            <li>Zustand (global synth state)</li>
            <li>GLSL fragment/vertex shaders (vite-plugin-glsl)</li>
            <li>Tailwind CSS</li>
            <li>Vitest (preset contract tests)</li>
          </ul>
        </section>

        {/* K. Footer CTA */}
        <footer className="border-t border-white/20 pt-10">
          <h2 className="mb-4 text-lg font-medium uppercase tracking-wide text-white">
            Try it yourself
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300 md:text-base">
            Run the living demo on{" "}
            <Link to="/" className="underline hover:text-white">/</Link>, design and
            export preset JSON in{" "}
            <Link to="/studio" className="underline hover:text-white">Background Studio</Link>
            , read the embed guide in{" "}
            <code className="text-zinc-200">src/lib/preset/PORTING.md</code>, or
            the formula notes in{" "}
            <code className="text-zinc-200">MATH.md</code> in the repo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={navLinkClass}>
              Try /
            </Link>
            <Link to="/studio" className={navLinkClass}>
              Open Studio
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={navLinkClass}
            >
              GitHub
            </a>
          </div>
        </footer>
      </article>
    </main>
  );
}
