import { useRef, useState, type ChangeEvent } from "react";
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
import { useSynthStore } from "@/store/useSynthStore";

export function ExportActions() {
  const presetImportRef = useRef<HTMLInputElement>(null);
  const [includeImagesInPreset, setIncludeImagesInPreset] = useState(false);
  const imageTexture = useSynthStore((s) => s.imageTexture);

  const exportPng = () => {
    if (!imageTexture) {
      window.alert("Upload a background image first.");
      return;
    }
    const canvas = getSynthCanvas();
    if (canvas) exportCanvasPng(canvas, "image-editor.png", 1.5);
  };

  const exportWebm = async () => {
    if (!imageTexture) {
      window.alert("Upload a background image first.");
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

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-white/20 p-4 pt-4">
      <button
        type="button"
        className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={exportPng}
      >
        Export PNG
      </button>
      <button
        type="button"
        className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={() => void exportWebm()}
      >
        Export Loop WebM
      </button>

      <label className="flex cursor-pointer items-center gap-2 border border-white/20 px-3 py-2 text-[10px] uppercase tracking-wide text-zinc-300">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-white"
          checked={includeImagesInPreset}
          onChange={(e) => setIncludeImagesInPreset(e.target.checked)}
        />
        Include images in preset
      </label>

      <button
        type="button"
        className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={() => void copyPreset()}
      >
        Copy preset
      </button>
      <button
        type="button"
        className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={() => void downloadPreset()}
      >
        Download preset.json
      </button>

      <input
        ref={presetImportRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportPreset}
      />
      <button
        type="button"
        className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={() => presetImportRef.current?.click()}
      >
        Import preset
      </button>
    </div>
  );
}
