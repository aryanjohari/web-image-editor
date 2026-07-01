import { FEATURED_PRESETS, LEGACY_PRESETS, type PresetCatalogEntry } from "@/data/presetCatalog";
import { applyStylePreset } from "@/lib/preset";
import { getPreserveTextOnApply } from "@/lib/preset/presetApplyPreference";
import type { SynthPresetV2 } from "@/lib/preset/types";
import { validatePresetV2 } from "@/lib/preset/validate";
import { PreserveTextToggle } from "@/components/PreserveTextToggle";
import { useSynthStore } from "@/store/useSynthStore";

export type IdeasGalleryProps = {
  sectionLabel?: string;
  hidePreserveToggle?: boolean;
};

function PresetLookButton({
  entry,
  onApply,
}: {
  entry: PresetCatalogEntry;
  onApply: (label: string, raw: SynthPresetV2) => void;
}) {
  return (
    <button
      type="button"
      className="w-full rounded border border-white/25 px-3 py-3.5 text-left text-[10px] uppercase tracking-[0.18em] text-zinc-200 transition hover:bg-white hover:text-black"
      title={entry.description}
      aria-label={`Apply ${entry.label} look`}
      onClick={() => void onApply(entry.label, entry.preset)}
    >
      {entry.label}
    </button>
  );
}

export function IdeasGallery({
  sectionLabel = "Background looks",
  hidePreserveToggle = false,
}: IdeasGalleryProps) {
  const resetSynthLookToDefaults = useSynthStore((s) => s.resetSynthLookToDefaults);

  const apply = async (label: string, raw: SynthPresetV2) => {
    try {
      const preset = validatePresetV2(raw);
      applyStylePreset(preset, { preserveText: getPreserveTextOnApply() });
    } catch (e) {
      console.error("[IdeasGallery]", label, e);
    }
  };

  return (
    <section aria-label={sectionLabel} className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{sectionLabel}</p>
      {!hidePreserveToggle ? <PreserveTextToggle /> : null}
      <div className="flex flex-col gap-1.5">
        {FEATURED_PRESETS.map((entry) => (
          <PresetLookButton key={entry.id} entry={entry} onApply={apply} />
        ))}
      </div>
      <details className="group">
        <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
          More looks
        </summary>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {LEGACY_PRESETS.map((entry) => (
            <PresetLookButton key={entry.id} entry={entry} onApply={apply} />
          ))}
        </div>
      </details>
      <button
        type="button"
        className="w-full rounded border border-dashed border-white/35 px-3 py-2.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 transition hover:border-white hover:bg-white/5 hover:text-zinc-100"
        onClick={() => resetSynthLookToDefaults()}
      >
        Reset look
      </button>
      <p className="text-[10px] leading-relaxed text-zinc-600">
        One tap applies the look; your hero texture and overlay uploads stay unless the preset embeds images. Turn off
        &quot;Keep preview text&quot; to also apply preset demo typography. Reset look restores default effects and
        one blank preview text layer without removing uploads.
      </p>
    </section>
  );
}
