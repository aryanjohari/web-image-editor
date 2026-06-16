import { PRESET_CATALOG } from "@/data/presetCatalog";
import { applyStylePreset } from "@/lib/preset";
import { getPreserveTextOnApply } from "@/lib/preset/presetApplyPreference";
import type { SynthPresetV2 } from "@/lib/preset/types";
import { validatePresetV2 } from "@/lib/preset/validate";
import { PreserveTextToggle } from "@/components/PreserveTextToggle";
import { useSynthStore } from "@/store/useSynthStore";

export type IdeasGalleryProps = {
  /** Tighter layout for the top-left Ideas details menu */
  variant?: "default" | "dropdown";
};

export function IdeasGallery({ variant = "default" }: IdeasGalleryProps) {
  const resetSynthLookToDefaults = useSynthStore((s) => s.resetSynthLookToDefaults);

  const apply = async (label: string, raw: SynthPresetV2) => {
    try {
      const preset = validatePresetV2(raw);
      applyStylePreset(preset, { preserveText: getPreserveTextOnApply() });
    } catch (e) {
      console.error("[IdeasGallery]", label, e);
    }
  };

  const isDropdown = variant === "dropdown";

  return (
    <section aria-label="Example looks" className={`flex flex-col ${isDropdown ? "gap-2" : "gap-3"}`}>
      {!isDropdown ? (
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Ideas</p>
      ) : null}
      <PreserveTextToggle compact={isDropdown} />
      <div className={isDropdown ? "flex flex-col gap-1.5" : "columns-2 gap-x-3 sm:columns-3"}>
        {PRESET_CATALOG.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`w-full rounded border border-white/25 text-left text-[10px] uppercase tracking-[0.18em] text-zinc-200 transition hover:bg-white hover:text-black ${
              isDropdown ? "px-2.5 py-2" : "mb-3 break-inside-avoid px-3 py-3.5"
            }`}
            onClick={() => void apply(entry.label, entry.preset)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`w-full rounded border border-dashed border-white/35 text-[10px] uppercase tracking-[0.18em] text-zinc-400 transition hover:border-white hover:bg-white/5 hover:text-zinc-100 ${
          isDropdown ? "px-2.5 py-2" : "px-3 py-2.5"
        }`}
        onClick={() => resetSynthLookToDefaults()}
      >
        Reset look
      </button>
      {!isDropdown ? (
        <p className="text-[10px] leading-relaxed text-zinc-600">
          One tap applies the look; your background/decal uploads stay intact unless you import a preset with
          embedded images. Turn off &quot;Keep my text&quot; to also apply preset demo typography. Reset look
          restores default effects and one blank text layer without removing uploads.
        </p>
      ) : (
        <p className="text-[9px] leading-relaxed text-zinc-500">
          Applies looks; uploads stay unless a preset embeds images. Toggle off to apply preset text.
        </p>
      )}
    </section>
  );
}
