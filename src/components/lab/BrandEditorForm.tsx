import { PRESET_CATALOG } from "@/data/presetCatalog";
import type { StageBrandKit, StageBrandLimits, StageColorToken, StageFontToken } from "@/lib/stage/types";

export const brandEditorInputClass =
  "w-full border border-white/25 bg-black/60 px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40";

export const brandEditorLabelClass = "text-[10px] uppercase tracking-[0.16em] text-zinc-500";

export function parseHexList(raw: string): StageColorToken[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((hex, i) => {
      const normalized = hex.startsWith("#") ? hex : `#${hex}`;
      return { id: `c${i + 1}`, hex: normalized };
    });
}

export function parseFontList(raw: string): StageFontToken[] {
  return raw
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((family, i) => ({ id: `f${i + 1}`, family }));
}

export function colorsToString(colors: StageColorToken[]): string {
  return colors.map((c) => c.hex).join(", ");
}

export function fontsToString(fonts: StageFontToken[]): string {
  return fonts.map((f) => f.family).join(", ");
}

export type BrandEditorFormProps = {
  draft: StageBrandKit;
  colorsText: string;
  fontsText: string;
  onDraftChange: (next: StageBrandKit) => void;
  onColorsTextChange: (raw: string) => void;
  onFontsTextChange: (raw: string) => void;
};

export function BrandEditorForm({
  draft,
  colorsText,
  fontsText,
  onDraftChange,
  onColorsTextChange,
  onFontsTextChange,
}: BrandEditorFormProps) {
  const allowedLookIds = draft.limits?.allowedLookIds ?? [];

  const toggleLook = (id: string) => {
    const current = draft.limits?.allowedLookIds ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    const limits: StageBrandLimits = {
      ...draft.limits,
      allowedLookIds: next.length ? next : undefined,
    };
    onDraftChange({ ...draft, limits });
  };

  const setLimitNum = (
    key: keyof Pick<StageBrandLimits, "maxMeltIntensity" | "maxNoiseLevel" | "maxScanlineIntensity">,
    raw: string,
  ) => {
    const limits = { ...draft.limits };
    if (raw.trim() === "") {
      delete limits[key];
    } else {
      const n = Number(raw);
      if (Number.isFinite(n)) limits[key] = n;
    }
    const cleaned = Object.keys(limits).length ? limits : undefined;
    onDraftChange({ ...draft, limits: cleaned });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={brandEditorLabelClass}>Name</span>
        <input
          className={brandEditorInputClass}
          value={draft.name}
          onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
          placeholder="Acme Co"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={brandEditorLabelClass}>Colors (hex, comma-separated)</span>
        <input
          className={brandEditorInputClass}
          value={colorsText}
          onChange={(e) => onColorsTextChange(e.target.value)}
          placeholder="#0a0b0c, #f5f0e8, #c45c26"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={brandEditorLabelClass}>Fonts (comma-separated)</span>
        <input
          className={brandEditorInputClass}
          value={fontsText}
          onChange={(e) => onFontsTextChange(e.target.value)}
          placeholder="Fraunces, IBM Plex Sans"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={brandEditorLabelClass}>Voice notes</span>
        <textarea
          className={`${brandEditorInputClass} min-h-[3.5rem] resize-y normal-case tracking-normal`}
          value={draft.voiceNotes ?? ""}
          onChange={(e) => onDraftChange({ ...draft, voiceNotes: e.target.value })}
          placeholder="Calm editorial; no neon; short headline copy"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={brandEditorLabelClass}>Allowed looks (optional)</legend>
        <div className="flex max-h-28 flex-col gap-1 overflow-y-auto border border-white/15 p-2">
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
          <span className={brandEditorLabelClass}>Max melt</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={brandEditorInputClass}
            value={draft.limits?.maxMeltIntensity ?? ""}
            onChange={(e) => setLimitNum("maxMeltIntensity", e.target.value)}
            placeholder="—"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={brandEditorLabelClass}>Max noise</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={brandEditorInputClass}
            value={draft.limits?.maxNoiseLevel ?? ""}
            onChange={(e) => setLimitNum("maxNoiseLevel", e.target.value)}
            placeholder="—"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={brandEditorLabelClass}>Max scan</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className={brandEditorInputClass}
            value={draft.limits?.maxScanlineIntensity ?? ""}
            onChange={(e) => setLimitNum("maxScanlineIntensity", e.target.value)}
            placeholder="—"
          />
        </label>
      </div>
    </div>
  );
}
