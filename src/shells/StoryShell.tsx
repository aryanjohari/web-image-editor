import { Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/aryanjohari/web-image-editor";

const navLinkClass =
  "border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black focus:outline-none focus:ring-1 focus:ring-white/50";

const PRESET_EXAMPLE = `{
  "presetSchemaVersion": 2,
  "engineVersion": "0.0.0",
  "synth": {
    "decalScale": 1,
    "decalOffsetX": -0.04,
    "decalOffsetY": 0.02,
    "linkDecalToMath": true,
    "linkTextToMath": true,
    "textLayers": [
      {
        "id": "preset-idea-acid-noir",
        "text": "ACID NOIR",
        "color": "#c8ff00",
        "fontSize": 140,
        "offsetX": 0.06,
        "offsetY": -0.02,
        "scale": 1.05,
        "effectsLinked": true
      }
    ],
    "selectedTextLayerId": "preset-idea-acid-noir",
    "textLayerEffects": {}
  },
  "layerEffects": {
    "background": {
      "meltIntensity": 0.38,
      "colorBleed": 0.78,
      "colorA": "#120028",
      "colorB": "#00ffc8",
      "duotoneBlend": 0.62,
      "timeScale": 1.55
    },
    "decal": { "meltIntensity": 0.22, "timeScale": 1.85 },
    "text": { "meltIntensity": 0.12, "posterizeSteps": 10 }
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

const PIPELINE_DIAGRAM = `upload (PNG/JPEG/WebP)
  → Zustand store (textures, layerEffects, textLayers)
  → SynthMaterial uniforms (L0 / L1 / T0–T3)
  → fragment.glsl (warp → sample → shade → composite)
  → canvas

mood / AI
  → basePresetId + optional patch
  → applyStylePreset + applyPresetPatch
  → same photo, new look coefficients

export
  → PNG  (still frame)
  → WebM (loop / motion demo)
  → JSON (preset travels to other surfaces)`;

function StoryNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/35 bg-black/90 px-4 py-3 backdrop-blur-sm"
      aria-label="Site navigation"
    >
      <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">
        The Algorithm Engine
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/" className={navLinkClass}>
          Try it
        </Link>
        <Link to="/lab" className={navLinkClass}>
          Open Lab
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
          <h1 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">
            The Algorithm Engine
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300 md:text-base">
            A browser GPU look engine: upload a photo, describe a mood, tune
            sliders, export. Preset JSON is the portable contract between this
            app and any surface that implements the same shader stack — your
            pixels stay yours; the coefficients travel.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={navLinkClass}>
              Try /
            </Link>
            <Link to="/lab" className={navLinkClass}>
              Lab /lab
            </Link>
          </div>
        </header>

        {/* B. Problem & thesis */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Problem &amp; thesis
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            Generative AI gives you new pixels every time. This project gives you
            reproducible looks: the same photo with explicit numeric
            coefficients you can save, share, and replay. One single-pass WebGL
            compositor composites background, optional decal, and up to four text
            layers in one fragment program — no round-trip through desktop
            compositing software.
          </p>
        </section>

        {/* C. Pipeline */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Pipeline
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            End-to-end flow from upload to export:
          </p>
          <CodeBlock>{PIPELINE_DIAGRAM}</CodeBlock>
        </section>

        {/* D. Single-pass shader */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Single-pass shader tradeoff
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            One draw call per frame: background → decal → text slots, all in{" "}
            <code className="text-zinc-200">src/webgl/shaders/fragment.glsl</code>
            . Each logical layer gets its own uniform bank —{" "}
            <code className="text-zinc-200">L0</code> (background),{" "}
            <code className="text-zinc-200">L1</code> (decal),{" "}
            <code className="text-zinc-200">T0–T3</code> (text) — so melt,
            duotone, scanlines, and time can diverge per layer while staying in
            one program.
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            The per-pixel path is warp → sample → shade → composite. For the
            formula glossary (warp vs matrix vs composite), see{" "}
            <code className="text-zinc-200">MATH.md</code> in the repo.
          </p>
        </section>

        {/* E. Preset JSON */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Preset JSON (v2)
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            Presets are schema version{" "}
            <code className="text-zinc-200">2</code> (
            <code className="text-zinc-200">PRESET_SCHEMA_VERSION</code> in{" "}
            <code className="text-zinc-200">src/lib/preset/types.ts</code>).
            Ideas catalog entries (e.g.{" "}
            <code className="text-zinc-200">acid-noir</code>,{" "}
            <code className="text-zinc-200">glitch-core</code>,{" "}
            <code className="text-zinc-200">archive</code>, and seven more in{" "}
            <code className="text-zinc-200">src/data/presetCatalog.ts</code>)
            are style-only — no embedded{" "}
            <code className="text-zinc-200">assets</code>. Trimmed example from
            Acid Noir:
          </p>
          <CodeBlock>{PRESET_EXAMPLE}</CodeBlock>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            Share a catalog look via{" "}
            <code className="text-zinc-200">/lab?preset=glitch-core</code> (ids
            in{" "}
            <code className="text-zinc-200">src/data/presetCatalog.ts</code>).
            Key fields: <code className="text-zinc-200">layerEffects</code> per
            layer, <code className="text-zinc-200">synth.textLayers</code> for
            GPU text. To embed this preset format elsewhere, see{" "}
            <code className="text-zinc-200">src/lib/preset/PORTING.md</code>.
          </p>
        </section>

        {/* F. Apply modes */}
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
                  <td className="py-2">Stack JSON import with embedded images</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4 font-medium text-white">Style</td>
                  <td className="py-2 pr-4">
                    <code className="text-xs">applyStylePreset</code>
                  </td>
                  <td className="py-2 pr-4">Never</td>
                  <td className="py-2">Landing hero, full look when Keep my text is off</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-2 pr-4 font-medium text-white">Effects</td>
                  <td className="py-2 pr-4">
                    <code className="text-xs">applyEffectsOnlyFromPreset</code>
                  </td>
                  <td className="py-2 pr-4">Never</td>
                  <td className="py-2">Ideas, mood, URL preset when Keep my text is on</td>
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
            Mood (keywords + optional AI) always composes style then patch — it
            never replaces your uploaded pixels.
          </p>
        </section>

        {/* G. Triple export */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium uppercase tracking-wide text-white">
            Triple export
          </h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-300 md:text-base">
            <li>
              <strong className="font-medium text-white">PNG</strong> — still
              frame for social posts and portfolio thumbnails.
            </li>
            <li>
              <strong className="font-medium text-white">WebM</strong> — short
              looping clip when motion (melt, color cycle, scanlines) matters.
            </li>
            <li>
              <strong className="font-medium text-white">JSON</strong> — preset
              file for git, sharing, or porting to another app that implements
              the shader contract.
            </li>
          </ul>
        </section>

        {/* H. What AI does / doesn't */}
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
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
            <strong className="font-medium text-white">Doesn&apos;t:</strong>{" "}
            generate images or full preset files. When AI is off or unreachable,
            keyword mood mapping (
            <code className="text-zinc-200">mapMoodToPreset</code>) applies the
            same style + patch pipeline.
          </p>
        </section>

        {/* I. Tech stack */}
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

        {/* J. Footer CTA */}
        <footer className="border-t border-white/20 pt-10">
          <h2 className="mb-4 text-lg font-medium uppercase tracking-wide text-white">
            Try it yourself
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300 md:text-base">
            Run the living hero on <Link to="/" className="underline hover:text-white">/</Link>, upload
            and export in the{" "}
            <Link to="/lab" className="underline hover:text-white">lab</Link>, or
            read the full math notes in{" "}
            <code className="text-zinc-200">MATH.md</code> in the repo.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={navLinkClass}>
              Try /
            </Link>
            <Link to="/lab" className={navLinkClass}>
              Open Lab
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
