import { Link } from "react-router-dom";
import { AppNav, secondaryNavLinkClass } from "@/components/shell/AppNav";
import { WorkspaceLibrary } from "@/components/workspace/WorkspaceLibrary";

/**
 * Brands + Assets library — IndexedDB workspace, dedicated page (not a drawer).
 */
export function WorkspaceShell() {
  return (
    <div className="min-h-dvh bg-stage-bg font-stage text-stage-text">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 0%, rgba(126,184,168,0.08), transparent 50%), var(--stage-bg)",
        }}
      />
      <AppNav
        trailing={
          <Link to="/studio" className={secondaryNavLinkClass}>
            Open Studio
          </Link>
        }
      />
      <main className="relative mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-12">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl tracking-tight text-stage-text md:text-4xl">
            Workspace
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stage-muted">
            Brands and assets stored in this browser. Set an active brand, upload images, then create
            in Studio.
          </p>
        </header>
        <WorkspaceLibrary />
      </main>
    </div>
  );
}
