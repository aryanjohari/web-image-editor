import { Link } from "react-router-dom";
import { ExportActions } from "@/components/controls/ExportActions";

export type LabTopBarProps = {
  libraryOpen: boolean;
  studioOpen: boolean;
  onToggleLibrary: () => void;
  onToggleStudio: () => void;
};

const chip =
  "border border-white/35 bg-black/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black";

/**
 * Minimal lab chrome — Library / Studio / Export over full-bleed canvas.
 */
export function LabTopBar({
  libraryOpen,
  studioOpen,
  onToggleLibrary,
  onToggleStudio,
}: LabTopBarProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[65] flex items-start justify-between gap-3 p-3">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <Link to="/" className={`${chip} no-underline`}>
          Stage
        </Link>
        <button
          type="button"
          className={chip}
          aria-expanded={libraryOpen}
          onClick={onToggleLibrary}
        >
          {libraryOpen ? "Close library" : "Library"}
        </button>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <ExportActions variant="menu" />
        <button
          type="button"
          className={chip}
          aria-expanded={studioOpen}
          onClick={onToggleStudio}
        >
          {studioOpen ? "Close studio" : "Studio"}
        </button>
      </div>
    </header>
  );
}
