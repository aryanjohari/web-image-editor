import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { getSynthCanvas } from "@/constants/synthCanvas";
import { applyBriefFromText } from "@/lib/stage/applyBrief";
import { brandKitHasRules } from "@/lib/stage/brandKitStorage";
import type { StageBrandKit } from "@/lib/stage/types";
import {
  ensureWorkspaceMigrated,
  getActiveBrand,
  subscribeWorkspace,
} from "@/lib/stage/workspace";

const POSITION_KEY = "stage.lab.floatingBrief.pos.v1";
const COLLAPSED_KEY = "stage.lab.floatingBrief.collapsed.v1";

type Pos = { x: number; y: number };

function loadPos(): Pos {
  try {
    const raw = sessionStorage.getItem(POSITION_KEY);
    if (!raw) return { x: 24, y: 72 };
    const parsed = JSON.parse(raw) as Pos;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  } catch {
    /* ignore */
  }
  return { x: 24, y: 72 };
}

function savePos(pos: Pos) {
  try {
    sessionStorage.setItem(POSITION_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function loadCollapsed(): boolean {
  try {
    return sessionStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveCollapsed(collapsed: boolean) {
  try {
    sessionStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

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

export type FloatingBriefProps = {
  onBriefApplied?: () => void;
};

/**
 * Draggable floating brief — Apply uses applyBriefFromText + active workspace brand.
 * Desktop: free drag (sessionStorage). Narrow: docks to bottom.
 */
export function FloatingBrief({ onBriefApplied }: FloatingBriefProps) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [pos, setPos] = useState<Pos>(loadPos);
  const [activeBrand, setActiveBrand] = useState<StageBrandKit | null>(null);
  const [narrow, setNarrow] = useState(false);
  const latestPos = useRef(pos);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    latestPos.current = pos;
  }, [pos]);

  const refreshBrand = async () => {
    try {
      await ensureWorkspaceMigrated();
      setActiveBrand(await getActiveBrand());
    } catch {
      setActiveBrand(null);
    }
  };

  useEffect(() => {
    void refreshBrand();
    return subscribeWorkspace(() => {
      void refreshBrand();
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const setCollapsedPersisted = (next: boolean) => {
    setCollapsed(next);
    saveCollapsed(next);
  };

  const onDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (narrow) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
  };

  const onDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = {
      x: Math.max(8, drag.originX + (e.clientX - drag.startX)),
      y: Math.max(8, drag.originY + (e.clientY - drag.startY)),
    };
    setPos(next);
  };

  const onDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    savePos(latestPos.current);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

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
      setActiveBrand(brand);
      const result = await applyBriefFromText(trimmed, {
        brand,
        canvas: getSynthCanvas(),
      });
      setFeedback(buildFeedback(result));
      onBriefApplied?.();
    } catch (err) {
      console.error("[FloatingBrief]", err);
      setFeedback("Brief apply failed");
    } finally {
      setIsApplying(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const brandLabel = activeBrand?.name?.trim() || null;
  const rulesHint = brandKitHasRules(activeBrand) ? "on-brand" : "weak constitution";

  if (collapsed) {
    return (
      <button
        type="button"
        className={`pointer-events-auto fixed z-[70] border border-white/40 bg-black/85 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-white hover:text-black ${
          narrow ? "bottom-4 left-1/2 -translate-x-1/2" : ""
        }`}
        style={narrow ? undefined : { left: pos.x, top: pos.y }}
        onClick={() => setCollapsedPersisted(false)}
        aria-label="Open brief"
      >
        Brief
      </button>
    );
  }

  return (
    <div
      className={`pointer-events-auto fixed z-[70] flex w-[min(100vw-1.5rem,22rem)] flex-col border border-white/30 bg-black/85 shadow-2xl backdrop-blur-md ${
        narrow ? "bottom-3 left-3 right-3 w-auto" : ""
      }`}
      style={narrow ? undefined : { left: pos.x, top: pos.y }}
    >
      <div
        className={`flex items-center justify-between gap-2 border-b border-white/20 px-3 py-2 ${
          narrow ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-300">Brief</p>
          <p className="truncate text-[9px] uppercase tracking-[0.12em] text-zinc-500">
            {brandLabel ? `${brandLabel} · ${rulesHint}` : "No active brand"}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 border border-white/25 px-2 py-0.5 text-[9px] uppercase tracking-wide text-zinc-400 hover:text-white"
          onClick={() => setCollapsedPersisted(true)}
        >
          Minimize
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 p-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isApplying}
          placeholder="Soft editorial launch hero — cool navy, slow drift…"
          aria-label="Creative brief"
          rows={3}
          className="w-full resize-y border border-white/35 bg-black/60 px-3 py-2 text-[12px] leading-relaxed text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isApplying}
          className="self-start border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black disabled:opacity-50"
        >
          {isApplying ? "Applying…" : "Apply"}
        </button>
        {feedback ? (
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">{feedback}</p>
        ) : (
          <p className="text-[10px] leading-relaxed text-zinc-600">
            Gemini when enabled; otherwise keyword fallback. Escape / click-away keeps this open.
          </p>
        )}
      </form>
    </div>
  );
}
