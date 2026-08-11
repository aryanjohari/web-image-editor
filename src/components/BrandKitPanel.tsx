import { useEffect, useMemo, useState } from "react";
import { PRESET_CATALOG } from "@/data/presetCatalog";
import {
  brandKitHasRules,
  clearActiveBrandKit,
  createDefaultActiveBrandKit,
  loadActiveBrandKit,
  saveActiveBrandKit,
} from "@/lib/stage/brandKitStorage";
import type { StageBrandKit, StageBrandLimits, StageColorToken, StageFontToken } from "@/lib/stage/types";

const inputClass =
  "w-full border border-white/25 bg-black/60 px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40";

const labelClass = "text-[10px] uppercase tracking-[0.16em] text-zinc-500";

function parseHexList(raw: string): StageColorToken[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((hex, i) => {
      const normalized = hex.startsWith("#") ? hex : `#${hex}`;
      return { id: `c${i + 1}`, hex: normalized };
    });
}

function parseFontList(raw: string): StageFontToken[] {
  return raw
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((family, i) => ({ id: `f${i + 1}`, family }));
}

function colorsToString(colors: StageColorToken[]): string {
  return colors.map((c) => c.hex).join(", ");
}

function fontsToString(fonts: StageFontToken[]): string {
  return fonts.map((f) => f.family).join(", ");
}

/**
 * Legacy single brand kit panel (localStorage). Lab remake uses LibraryDrawer + workspace IDB.
 * Kept for possible reuse / migration tooling — not mounted by LabShell.
 */
export function BrandKitPanel() {
  const [draft, setDraft] = useState<StageBrandKit>(() => loadActiveBrandKit() ?? createDefaultActiveBrandKit());
  const [saved, setSaved] = useState<StageBrandKit | null>(() => loadActiveBrandKit());
  const [colorsText, setColorsText] = useState(() => colorsToString(draft.colors));
  const [fontsText, setFontsText] = useState(() => fontsToString(draft.fonts));
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadActiveBrandKit();
    if (loaded) {
      setDraft(loaded);
      setSaved(loaded);
      setColorsText(colorsToString(loaded.colors));
      setFontsText(fontsToString(loaded.fonts));
    }
  }, []);

  const allowedLookIds = draft.limits?.allowedLookIds ?? [];

  const activeLabel = useMemo(() => {
    if (!saved || !brandKitHasRules(saved)) return null;
    return saved.name || "Untitled brand";
  }, [saved]);

  const toggleLook = (id: string) => {
    setDraft((prev) => {
      const current = prev.limits?.allowedLookIds ?? [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      const limits: StageBrandLimits = { ...prev.limits, allowedLookIds: next.length ? next : undefined };
      return { ...prev, limits };
    });
  };

  const onSave = () => {
    const next = saveActiveBrandKit({
      ...draft,
      colors: parseHexList(colorsText),
      fonts: parseFontList(fontsText),
    });
    setDraft(next);
    setSaved(next);
    setColorsText(colorsToString(next.colors));
    setFontsText(fontsToString(next.fonts));
    setStatus("Brand kit saved (localStorage)");
  };

  const onReset = () => {
    clearActiveBrandKit();
    const empty = createDefaultActiveBrandKit();
    setDraft(empty);
    setSaved(null);
    setColorsText("");
    setFontsText("");
    setStatus("Brand kit cleared");
  };

  const setLimitNum = (key: keyof Pick<StageBrandLimits, "maxMeltIntensity" | "maxNoiseLevel" | "maxScanlineIntensity">, raw: string) => {
    setDraft((prev) => {
      const limits = { ...prev.limits };
      if (raw.trim() === "") {
        delete limits[key];
      } else {
        const n = Number(raw);
        if (Number.isFinite(n)) limits[key] = n;
      }
      const cleaned = Object.keys(limits).length ? limits : undefined;
      return { ...prev, limits: cleaned };
    });
  };

  return (
    <div className="flex flex-col gap-3 border border-white/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Brand kit</span>
        {activeLabel ? (
          <span className="border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-200">
            Active: {activeLabel}
          </span>
        ) : (
          <span className="border border-white/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-zinc-500">
            No brand saved — brief still works (weaker AI prompt)
          </span>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Acme Co"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Colors (hex, comma-separated)</span>
        <input
          className={inputClass}
          value={colorsText}
          onChange={(e) => setColorsText(e.target.value)}
          placeholder="#0a0b0c, #f5f0e8, #c45c26"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Fonts (comma-separated)</span>
        <input
          className={inputClass}
          value={fontsText}
          onChange={(e) => setFontsText(e.target.value)}
          placeholder="Fraunces, IBM Plex Sans"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Voice notes</span>
        <textarea
          className={`${inputClass} min-h-[3.5rem] resize-y normal-case tracking-normal`}
          value={draft.voiceNotes ?? ""}
          onChange={(e) => setDraft((p) => ({ ...p, voiceNotes: e.target.value }))}
          placeholder="Calm editorial; no neon; short headline copy"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={labelClass}>Allowed looks (optional)</legend>
        <div className="max-h-28 overflow-y-auto border border-white/15 p-2 flex flex-col gap-1">
          {PRESET_CATALOG.map((entry) => (
            <label key={entry.id} className="flex items-center gap-2 text-[11px] text-zinc-300">
              <input
                type="checkbox"
                checked={allowedLookIds.includes(entry.id)}
                onChange={() => toggleLook(entry.id)}
              />
              <span>{entry.label}</span>
              <span className="text-zinc-600">({entry.id})</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Max melt</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={inputClass}
            value={draft.limits?.maxMeltIntensity ?? ""}
            onChange={(e) => setLimitNum("maxMeltIntensity", e.target.value)}
            placeholder="—"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Max noise</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={inputClass}
            value={draft.limits?.maxNoiseLevel ?? ""}
            onChange={(e) => setLimitNum("maxNoiseLevel", e.target.value)}
            placeholder="—"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Max scan</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={inputClass}
            value={draft.limits?.maxScanlineIntensity ?? ""}
            onChange={(e) => setLimitNum("maxScanlineIntensity", e.target.value)}
            placeholder="—"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="border border-white/35 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white hover:text-black"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onReset}
          className="border border-white/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 hover:border-white/50 hover:text-white"
        >
          Reset
        </button>
      </div>
      {status ? <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{status}</p> : null}
    </div>
  );
}
