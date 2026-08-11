import { useState, type FormEvent } from "react";
import { getSynthCanvas } from "@/constants/synthCanvas";
import { applyBriefFromText } from "@/lib/stage/applyBrief";
import { ensureWorkspaceMigrated, getActiveBrand } from "@/lib/stage/workspace";

export type BriefInputProps = {
  disabled?: boolean;
  onBriefApplied?: () => void;
};

function buildFeedback(result: Awaited<ReturnType<typeof applyBriefFromText>>): string {
  if (result.source === "gemini") {
    const summary = result.summary ? ` — ${result.summary}` : "";
    return `Applied via Gemini: ${result.label}${summary}`;
  }
  if (result.aiFailed) {
    return `Couldn't reach AI — keyword fallback: ${result.label}`;
  }
  return result.fallback
    ? `Keyword look: ${result.label} (try calm, cinematic, warm…)`
    : `Keyword look: ${result.label}`;
}

/**
 * Brief control — textarea brief → Gemini patch (or keyword fallback).
 * Uses active brand from IndexedDB workspace (migrates legacy localStorage kit once).
 */
export function BriefInput({ disabled = false, onBriefApplied }: BriefInputProps) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setFeedback("Type a brief…");
      return;
    }
    setIsApplying(true);
    try {
      await ensureWorkspaceMigrated();
      const brand = await getActiveBrand();
      const result = await applyBriefFromText(trimmed, {
        brand,
        canvas: getSynthCanvas(),
      });
      setFeedback(buildFeedback(result));
      onBriefApplied?.();
    } catch (err) {
      console.error("[BriefInput]", err);
      setFeedback("Brief apply failed");
    } finally {
      setIsApplying(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const inputDisabled = disabled || isApplying;

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Brief</span>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={inputDisabled}
            placeholder="Soft editorial launch hero — cool navy, slow drift, headline Launch"
            aria-label="Creative brief"
            rows={3}
            className="w-full resize-y border border-white/35 bg-black/80 px-3 py-2 text-[12px] leading-relaxed text-white backdrop-blur-sm placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={inputDisabled}
          className="self-start border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-black/80 disabled:hover:text-white"
        >
          {isApplying ? "Applying…" : "Apply brief"}
        </button>
      </form>
      {feedback ? (
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">{feedback}</p>
      ) : (
        <p className="text-[10px] leading-relaxed text-zinc-600">
          AI uses Gemini when enabled; otherwise (or on failure) keyword mood picks a catalog look.
        </p>
      )}
    </div>
  );
}
