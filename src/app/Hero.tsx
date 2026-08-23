import { useEffect, useRef, useState } from "react";
import { Compositor } from "../compositor/renderer";
import { ENGINE_VERSION, SCHEMA_VERSION, type Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";

/** Bundled same-origin textures for hero-lite (M04 X9). */
const HERO_RECIPE: Recipe = validateRecipe({
  schemaVersion: SCHEMA_VERSION,
  engineVersion: ENGINE_VERSION,
  packId: "warm-film",
  packVersion: "1.0.0",
  meta: { title: "Prism hero" },
  objects: [
    {
      id: "main",
      kind: "image",
      role: "main",
      z: 0,
      visible: true,
      opacity: 1,
      blend: "normal",
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      effects: [
        { id: "temperature", params: { amount: 0.28 } },
        { id: "fade", params: { amount: 0.18 } },
        { id: "grain", params: { amount: 0.22 } },
        { id: "vignette", params: { amount: 0.35 } },
      ],
      source: { type: "url", url: "/hero/main.png" },
    },
    {
      id: "overlay",
      kind: "image",
      role: "overlay",
      z: 1,
      visible: true,
      opacity: 0.35,
      blend: "screen",
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      effects: [],
      source: { type: "url", url: "/hero/overlay.png" },
    },
    {
      id: "title",
      kind: "text",
      z: 2,
      visible: true,
      opacity: 0.92,
      blend: "normal",
      transform: { x: 0, y: -0.32, scaleX: 1, scaleY: 1, rotation: 0 },
      effects: [],
      text: {
        content: "Prism",
        fontFamily: "IBM Plex Serif, Georgia, serif",
        fontWeight: 500,
        fontSize: 56,
        color: "#f2f0eb",
        align: "center",
      },
    },
  ],
});

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let cancelled = false;
    let compositor: Compositor;
    try {
      compositor = new Compositor(canvas);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    const draw = async () => {
      if (cancelled) return;
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);
      compositor.resize(cssW, cssH);
      // prefers-reduced-motion: still contract (no u_time in Tier A grade).
      void reducedMotion;
      const ok = await compositor.render({
        recipe: HERO_RECIPE,
        assetsById: new Map(),
      });
      if (cancelled) return;
      if (!ok) {
        setError(compositor.getError()?.message ?? "hero render failed");
      } else {
        setError(null);
      }
    };

    void draw();
    const ro = new ResizeObserver(() => {
      if (!cancelled) void draw();
    });
    ro.observe(wrap);

    return () => {
      cancelled = true;
      ro.disconnect();
      compositor.dispose();
    };
  }, [reducedMotion]);

  return (
    <div className="hero">
      <div className="hero-stage" ref={wrapRef} aria-hidden="true">
        <canvas ref={canvasRef} className="hero-canvas" width={960} height={540} />
      </div>
      <div className="hero-copy">
        <p className="hero-brand">Prism</p>
        <h1>Still looks, leaving the tab.</h1>
        <p className="muted">
          Hero-lite mounts the same compositor with bundled{" "}
          <code>{`{ type: "url" }`}</code> textures. Pointer events off; reduced-motion stays
          still.
        </p>
        <p>
          <a href="/">Open lab</a>
        </p>
        {error && <p className="hero-error">{error}</p>}
        {reducedMotion && <p className="muted">prefers-reduced-motion: still frame</p>}
      </div>
    </div>
  );
}
