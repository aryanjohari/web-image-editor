import { Link } from "react-router-dom";
import { AppNav, secondaryNavLinkClass } from "@/components/shell/AppNav";

/**
 * Soft landing — product name, one sentence, CTAs. No heavy WebGL.
 */
export function HomeShell() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-stage-bg font-stage text-stage-text">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 15% 10%, rgba(126,184,168,0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(90,110,150,0.12), transparent 50%), linear-gradient(165deg, #161922 0%, var(--stage-bg) 45%, #0e1016 100%)",
        }}
      />

      <AppNav
        trailing={
          <Link to="/embed-demo" className={`${secondaryNavLinkClass} text-stage-muted`}>
            Embed demo
          </Link>
        }
      />

      <main className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-5xl flex-col justify-center px-4 py-16 md:px-6 md:py-24">
        <div className="stage-page-motion max-w-xl">
          <h1 className="font-display text-5xl leading-[1.1] tracking-tight text-stage-text md:text-6xl">
            Stage
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-stage-muted md:text-lg">
            Set brand rules once. Brief in — campaign pack and live background recipe out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/workspace"
              className="inline-flex items-center justify-center rounded-2xl bg-stage-text px-5 py-3 text-sm font-medium text-stage-bg no-underline transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
            >
              Open Workspace
            </Link>
            <Link
              to="/studio"
              className="inline-flex items-center justify-center rounded-2xl border border-stage-border bg-stage-panel/80 px-5 py-3 text-sm font-medium text-stage-text no-underline transition hover:border-stage-accent/40 hover:bg-stage-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
            >
              Open Studio
            </Link>
          </div>
        </div>

        <ol className="mt-20 grid gap-8 border-t border-stage-border pt-12 sm:grid-cols-3 sm:gap-6">
          {[
            {
              step: "1",
              title: "Workspace",
              body: "Create a brand and upload assets in this browser.",
            },
            {
              step: "2",
              title: "Studio",
              body: "Apply a hero, brief with brand rules, and tune the look.",
            },
            {
              step: "3",
              title: "Export",
              body: "Download a campaign pack or StageRecipe for embeds.",
            },
          ].map((item) => (
            <li key={item.step} className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-stage-accent">
                {item.step} · {item.title}
              </span>
              <p className="text-sm leading-relaxed text-stage-muted">{item.body}</p>
            </li>
          ))}
        </ol>

        <footer className="mt-16 flex flex-wrap gap-4 text-sm text-stage-muted">
          <Link
            to="/story"
            className="text-stage-muted underline-offset-4 hover:text-stage-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
          >
            Case study
          </Link>
          <Link
            to="/embed-demo"
            className="text-stage-muted underline-offset-4 hover:text-stage-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
          >
            Embed demo
          </Link>
        </footer>
      </main>
    </div>
  );
}
