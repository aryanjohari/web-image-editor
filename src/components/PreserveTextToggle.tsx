import { usePreserveTextOnApply } from "@/hooks/usePreserveTextOnApply";

export type PreserveTextToggleProps = {
  /** Compact layout for dropdown Ideas menu */
  compact?: boolean;
};

export function PreserveTextToggle({ compact = false }: PreserveTextToggleProps) {
  const [preserveText, setPreserveText] = usePreserveTextOnApply();

  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
      <div
        className={`flex items-center justify-between gap-3 border border-white/20 ${
          compact ? "px-2 py-2" : "px-3 py-3"
        }`}
      >
        <span
          className={`min-w-0 flex-1 uppercase tracking-wide text-zinc-200 ${
            compact ? "text-[9px] tracking-[0.14em]" : "text-xs"
          }`}
        >
          Keep preview text
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={preserveText}
          aria-label="Keep preview text when applying background looks"
          onClick={() => setPreserveText(!preserveText)}
          className={`relative h-7 w-11 shrink-0 border border-white/35 transition-colors ${
            preserveText ? "bg-white" : "bg-zinc-900"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 bg-black transition-[left] ${
              preserveText ? "left-[calc(100%-1.375rem)]" : "left-0.5"
            }`}
            aria-hidden
          />
        </button>
      </div>
      {!compact ? (
        <p className="text-[10px] leading-relaxed text-zinc-600">
          When on, background looks and mood re-grade your hero texture only; preview text stays. On your live site,
          use HTML above the canvas instead of GPU text.
        </p>
      ) : (
        <p className="text-[9px] leading-relaxed text-zinc-500">
          Grade only — preview text stays.
        </p>
      )}
    </div>
  );
}
