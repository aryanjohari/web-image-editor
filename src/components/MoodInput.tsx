import { useState, type FormEvent, type KeyboardEvent } from "react";
import { applyMoodFromText } from "@/lib/mood/applyMood";

export type MoodInputProps = {
  disabled?: boolean;
  /** landing: default feedback copy; lab: can say "Applied to your upload" */
  variant?: "landing" | "lab";
  onMoodApplied?: () => void;
};

export function MoodInput({ disabled = false, variant = "landing", onMoodApplied }: MoodInputProps) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      if (variant === "landing") {
        setHint("Type a mood…");
        setFeedback(null);
      }
      return;
    }

    setHint(null);
    try {
      const result = applyMoodFromText(trimmed);
      if (variant === "lab") {
        setFeedback(
          result.fallback
            ? `Applied: ${result.label} — your upload unchanged (try glitch, neon, vhs…)`
            : `Applied: ${result.label} — your upload unchanged`,
        );
      } else {
        setFeedback(
          result.fallback
            ? `Applied: ${result.label} (try glitch, neon, vhs…)`
            : `Applied: ${result.label}`,
        );
      }
      onMoodApplied?.();
    } catch (err) {
      console.error("[MoodInput]", err);
      setFeedback(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <form onSubmit={onSubmit} className="flex items-stretch gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (hint) setHint(null);
          }}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="glitch, sunset, cold scan…"
          aria-label="Describe a mood"
          className="min-w-[12rem] border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition hover:bg-white hover:text-black disabled:opacity-50 disabled:hover:bg-black/80 disabled:hover:text-white"
        >
          Apply
        </button>
      </form>
      {feedback ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{feedback}</p>
      ) : null}
      {hint ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{hint}</p>
      ) : null}
    </div>
  );
}
