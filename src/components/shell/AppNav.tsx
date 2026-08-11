import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

export type AppNavVariant = "page" | "studio";

export type AppNavProps = {
  variant?: AppNavVariant;
  /** Extra controls on the right (e.g. Export on Studio). */
  trailing?: ReactNode;
  /** Optional chip / status between primary links and trailing. */
  meta?: ReactNode;
  className?: string;
};

const PRIMARY = [
  { to: "/", label: "Home", end: true },
  { to: "/workspace", label: "Workspace", end: false },
  { to: "/studio", label: "Studio", end: false },
] as const;

function navLinkClass(variant: AppNavVariant, isActive: boolean): string {
  if (variant === "studio") {
    return [
      "rounded-lg px-2.5 py-1.5 text-sm no-underline transition",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]",
      isActive
        ? "bg-white/10 text-stage-text"
        : "text-stage-muted hover:bg-white/5 hover:text-stage-text",
    ].join(" ");
  }
  return [
    "rounded-xl px-3 py-2 text-sm no-underline transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]",
    isActive
      ? "bg-stage-elevated text-stage-text"
      : "text-stage-muted hover:bg-white/5 hover:text-stage-text",
  ].join(" ");
}

/**
 * Primary product nav — Home · Workspace · Studio.
 * Page variant sits in soft shell headers; studio is a thin overlay bar.
 */
export function AppNav({ variant = "page", trailing, meta, className = "" }: AppNavProps) {
  const brand = (
    <Link
      to="/"
      className={[
        "shrink-0 rounded-xl px-2.5 py-1.5 font-display text-xl tracking-tight text-stage-text no-underline",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]",
        variant === "studio" ? "text-lg" : "",
      ].join(" ")}
    >
      Stage
    </Link>
  );

  const links = (
    <nav aria-label="Primary" className="flex flex-wrap items-center gap-0.5 sm:gap-1">
      {PRIMARY.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => navLinkClass(variant, isActive)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  if (variant === "studio") {
    return (
      <header
        className={`pointer-events-none absolute inset-x-0 top-0 z-[65] flex items-start justify-between gap-3 p-3 ${className}`.trim()}
      >
        <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-stage-border bg-stage-panel/85 px-2 py-1.5 shadow-stage backdrop-blur-md">
          {brand}
          {links}
          {meta ? <div className="ml-1 hidden min-w-0 sm:block">{meta}</div> : null}
        </div>
        {trailing ? (
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            {trailing}
          </div>
        ) : null}
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b border-stage-border bg-stage-bg/90 backdrop-blur-md ${className}`.trim()}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
          {brand}
          {links}
          {meta ? <div className="ml-1 hidden min-w-0 sm:block">{meta}</div> : null}
        </div>
        {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
      </div>
    </header>
  );
}

export const secondaryNavLinkClass =
  "rounded-xl border border-stage-border bg-stage-panel/80 px-3 py-2 text-sm text-stage-text no-underline transition hover:border-stage-accent/40 hover:bg-stage-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]";
