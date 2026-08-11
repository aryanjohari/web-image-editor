import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { getSynthCanvas } from "@/constants/synthCanvas";
import { exportCanvasPng } from "@/lib/export/exportImage";
import { exportLoopWebm } from "@/lib/export/exportLoopWebm";
import {
  applySynthPreset,
  buildPreset,
  gatherPresetExportInput,
  parsePresetJson,
  presetToJson,
  PresetValidationError,
  validatePreset,
} from "@/lib/preset";
import {
  applyStageRecipeJson,
  downloadCampaignPack,
  gatherStageRecipeExport,
  PackCaptureError,
  recipeToJson,
  STAGE_DEFAULT_PACK_PROFILE_IDS,
  getPackProfile,
} from "@/lib/stage";
import { useSynthStore } from "@/store/useSynthStore";

function packSizeHelperText(): string {
  const parts = STAGE_DEFAULT_PACK_PROFILE_IDS.map((id) => {
    const p = getPackProfile(id);
    if (!p?.width || !p?.height) return id;
    return `${p.id} ${p.width}×${p.height}`;
  });
  return `ZIP: ${parts.join(", ")} + stage-recipe.json (+ web_hero_live note).`;
}

export type ExportActionsProps = {
  /** footer: sticky stack (legacy). menu: top-bar dropdown. */
  variant?: "footer" | "menu";
};

export function ExportActions({ variant = "footer" }: ExportActionsProps) {
  const presetImportRef = useRef<HTMLInputElement>(null);
  const recipeImportRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [includeImagesInPreset, setIncludeImagesInPreset] = useState(false);
  const [packExportStatus, setPackExportStatus] = useState<string | null>(null);
  const imageTexture = useSynthStore((s) => s.imageTexture);
  const packBusy = packExportStatus != null;

  useEffect(() => {
    if (!menuOpen || variant !== "menu") return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, variant]);

  const exportPng = () => {
    if (!imageTexture) {
      window.alert("Upload a hero texture first.");
      return;
    }
    const canvas = getSynthCanvas();
    if (canvas) exportCanvasPng(canvas, "background-poster.png", 1.5);
  };

  const exportWebm = async () => {
    if (!imageTexture) {
      window.alert("Upload a hero texture first.");
      return;
    }
    const canvas = getSynthCanvas();
    if (canvas) await exportLoopWebm(canvas);
  };

  const getR3fCanvas = (): HTMLCanvasElement | null => getSynthCanvas();

  const copyPreset = async () => {
    const canvas = getR3fCanvas();
    if (!canvas) {
      window.alert("No canvas found.");
      return;
    }
    try {
      const input = await gatherPresetExportInput(canvas, includeImagesInPreset);
      const preset = buildPreset(input);
      const json = presetToJson(preset);
      await navigator.clipboard.writeText(json);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Copy failed.");
    }
  };

  const downloadPreset = async () => {
    const canvas = getR3fCanvas();
    if (!canvas) {
      window.alert("No canvas found.");
      return;
    }
    try {
      const input = await gatherPresetExportInput(canvas, includeImagesInPreset);
      const preset = buildPreset(input);
      const json = presetToJson(preset);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "synth-preset.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Download failed.");
    }
  };

  const downloadStageRecipe = async () => {
    const canvas = getR3fCanvas();
    if (!canvas) {
      window.alert("No canvas found.");
      return;
    }
    try {
      const recipe = await gatherStageRecipeExport(canvas, includeImagesInPreset);
      const json = recipeToJson(recipe);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stage-recipe.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Stage recipe download failed.");
    }
  };

  const onImportPreset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const raw = parsePresetJson(text);
      const preset = validatePreset(raw);
      await applySynthPreset(preset);
    } catch (e) {
      const msg = e instanceof PresetValidationError ? e.message : e instanceof Error ? e.message : "Import failed.";
      window.alert(msg);
    }
  };

  const onImportStageRecipe = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = await applyStageRecipeJson(text);
      if (!result.ok) {
        window.alert(result.error);
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Stage recipe import failed.");
    }
  };

  const exportCampaignPackZip = async () => {
    if (!imageTexture) {
      window.alert("Upload a hero texture first.");
      return;
    }
    const canvas = getR3fCanvas();
    if (!canvas) {
      window.alert("No canvas found.");
      return;
    }
    try {
      setPackExportStatus("Capturing pack…");
      await downloadCampaignPack({
        canvas,
        hasHeroTexture: true,
        includeImagesInRecipe: includeImagesInPreset,
      });
      setPackExportStatus("Done");
      window.setTimeout(() => setPackExportStatus(null), 1200);
    } catch (e) {
      setPackExportStatus(null);
      const msg =
        e instanceof PackCaptureError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Campaign pack export failed.";
      window.alert(msg);
    }
  };

  const btnClass =
    variant === "menu"
      ? "w-full rounded-xl border border-stage-border px-3 py-2 text-left text-sm text-stage-text transition hover:border-stage-accent/40 hover:bg-stage-elevated disabled:cursor-wait disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
      : "border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-50";

  const body = (
    <>
      {variant === "footer" ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Export</p>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Preset JSON (v2) remains the embed runtime format. StageRecipe (v3) is the product scene
            contract — export/import both from lab.
          </p>
        </>
      ) : (
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Campaign pack + StageRecipe. Hero texture required for pack / PNG / WebM.
        </p>
      )}

      <label
        className={
          variant === "menu"
            ? "flex cursor-pointer items-center gap-2 rounded-xl border border-stage-border px-3 py-2 text-sm text-stage-muted"
            : "flex cursor-pointer items-center gap-2 border border-white/20 px-3 py-2 text-[10px] uppercase tracking-wide text-zinc-300"
        }
      >
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-white"
          checked={includeImagesInPreset}
          onChange={(e) => setIncludeImagesInPreset(e.target.checked)}
        />
        Include images in preset / recipe
      </label>

      <button
        type="button"
        className={btnClass}
        disabled={packBusy}
        onClick={() => void exportCampaignPackZip()}
        title="Download ZIP with 3 stills at pack profile sizes plus StageRecipe JSON"
      >
        {packBusy ? packExportStatus : "Download campaign pack"}
      </button>
      <p className="text-[10px] leading-relaxed text-zinc-500">{packSizeHelperText()}</p>

      <button type="button" className={btnClass} onClick={() => void downloadStageRecipe()}>
        Download StageRecipe JSON
      </button>
      <button type="button" className={btnClass} onClick={() => void copyPreset()}>
        Copy preset JSON
      </button>
      <button type="button" className={btnClass} onClick={() => void downloadPreset()}>
        Download preset JSON
      </button>
      <button type="button" className={btnClass} onClick={() => void exportWebm()}>
        Export loop WebM
      </button>
      <button type="button" className={btnClass} onClick={exportPng}>
        Export PNG poster
      </button>

      <input
        ref={presetImportRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportPreset}
      />
      <button type="button" className={btnClass} onClick={() => presetImportRef.current?.click()}>
        Import preset
      </button>

      <input
        ref={recipeImportRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => void onImportStageRecipe(e)}
      />
      <button type="button" className={btnClass} onClick={() => recipeImportRef.current?.click()}>
        Import StageRecipe
      </button>
    </>
  );

  if (variant === "menu") {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="rounded-xl border border-stage-border bg-stage-panel/90 px-3 py-1.5 text-sm text-stage-text backdrop-blur-md transition hover:border-stage-accent/40 hover:bg-stage-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          Export
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-[80] mt-1 flex max-h-[min(70vh,28rem)] w-[min(100vw-1.5rem,18rem)] flex-col gap-2 overflow-y-auto rounded-2xl border border-stage-border bg-stage-panel/95 p-3 shadow-stage backdrop-blur-md"
          >
            {body}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-white/20 p-4 pt-4">{body}</div>
  );
}
