import { useEffect, useRef, useState } from "react";
import { Compositor } from "../compositor/renderer";
import { HERO_RECIPE } from "./heroRecipe";

type HeroStageProps = {
  wrapClassName: string;
  canvasClassName: string;
  showReducedMotionNote?: boolean;
};

export function HeroStage({
  wrapClassName,
  canvasClassName,
  showReducedMotionNote = false,
}: HeroStageProps) {
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
    <>
      <div className={wrapClassName} ref={wrapRef} aria-hidden="true">
        <canvas ref={canvasRef} className={canvasClassName} width={960} height={540} />
      </div>
      {error && <p className="hero-error">{error}</p>}
      {showReducedMotionNote && reducedMotion && (
        <p className="muted">prefers-reduced-motion: still frame</p>
      )}
    </>
  );
}
