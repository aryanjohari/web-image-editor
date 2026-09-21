import { HeroStage } from "./HeroStage";

export function Hero() {
  return (
    <div className="hero">
      <HeroStage wrapClassName="hero-stage" canvasClassName="hero-canvas" showReducedMotionNote />
      <div className="hero-copy">
        <p className="hero-brand">Prism</p>
        <h1>Still looks, leaving the tab.</h1>
        <p className="muted">
          Hero-lite mounts the same compositor with bundled{" "}
          <code>{`{ type: "url" }`}</code> textures. Pointer events off; reduced-motion stays
          still.
        </p>
        <p>
          <a href="/lab">Open lab</a>
        </p>
      </div>
    </div>
  );
}
