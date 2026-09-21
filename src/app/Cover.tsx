import { HeroStage } from "./HeroStage";

const GITHUB_URL = "https://github.com/aryanjohari/web-image-editor";
const ARCHITECTURE_URL =
  "https://github.com/aryanjohari/web-image-editor/blob/rewrite/v1-styling/docs/c4/README.md";

export function Cover() {
  return (
    <main className="cover">
      <div className="cover-copy">
        <p className="cover-brand">Prism</p>
        <h1>Parametric still-photo styling in the browser.</h1>
        <p className="cover-lede">
          Upload a still, pick a named look, then tune sliders — or describe a mood. Export PNG
          plus a recipe. The GPU does the math. Talk patches the same document; it does not invent
          pixels.
        </p>
        <p className="muted cover-honesty">Not Canva, not inpaint, not a site builder.</p>

        <h2 className="cover-howto-title">How to use</h2>
        <ol className="cover-howto">
          <li>Upload a still</li>
          <li>Pick a look pack</li>
          <li>Tune sliders, or type a mood</li>
          <li>Export PNG + recipe</li>
        </ol>

        <p className="cover-cta">
          <a className="button-primary" href="/lab">
            Open the lab
          </a>
        </p>
        <p className="cover-links">
          <a href={GITHUB_URL}>GitHub</a>
          <span aria-hidden="true"> · </span>
          <a href={ARCHITECTURE_URL}>Architecture</a>
        </p>
      </div>

      <div className="cover-proof">
        <HeroStage wrapClassName="cover-stage" canvasClassName="cover-canvas" />
        <p className="muted cover-proof-caption">Same compositor. Quiet still.</p>
      </div>
    </main>
  );
}
