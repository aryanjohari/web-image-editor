import { useRef, type ChangeEvent } from "react";
import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { useSynthStore } from "@/store/useSynthStore";
import { createProcessedDecalTexture } from "@/utils/decalTexture";

const DEBUG = false;

export type UploadButtonProps = {
  /** Background slot (full-frame image) vs sticker-book decal slot. */
  variant?: "background" | "decal";
};

export function UploadButton({ variant = "background" }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setImageTexture = useSynthStore((state) => state.setImageTexture);
  const setDecalTexture = useSynthStore((state) => state.setDecalTexture);
  const imageTexture = useSynthStore((state) => state.imageTexture);
  const decalTexture = useSynthStore((state) => state.decalTexture);
  const applyTexture = variant === "decal" ? setDecalTexture : setImageTexture;
  const hasSlot = variant === "decal" ? decalTexture != null : imageTexture != null;

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (DEBUG) {
      console.debug("[UploadButton] File selected", {
        ts: new Date().toISOString(),
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }

    if (variant === "decal") {
      void (async () => {
        const texture = await createProcessedDecalTexture(file);
        if (texture) {
          if (DEBUG) {
            console.debug("[UploadButton] Processed decal texture", {
              ts: new Date().toISOString(),
              texture,
            });
          }
          applyTexture(texture);
        } else if (DEBUG) {
          console.error("[UploadButton] Decal processing failed", {
            ts: new Date().toISOString(),
            name: file.name,
          });
        }
      })();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (DEBUG) {
      console.debug("[UploadButton] Object URL created", {
        ts: new Date().toISOString(),
        objectUrl,
      });
    }

    new TextureLoader().load(
      objectUrl,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.needsUpdate = true;

        if (DEBUG) {
          console.debug("[UploadButton] TextureLoader onLoad texture", {
            ts: new Date().toISOString(),
            texture,
            image: texture.image,
          });
        }

        applyTexture(texture);
        URL.revokeObjectURL(objectUrl);
      },
      undefined,
      (error) => {
        if (DEBUG) {
          console.error("[UploadButton] TextureLoader onError", {
            ts: new Date().toISOString(),
            objectUrl,
            error,
          });
        }
        URL.revokeObjectURL(objectUrl);
      },
    );
  };

  const clearSlot = () => {
    if (variant === "decal") {
      setDecalTexture(null);
    } else {
      setImageTexture(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={variant === "decal" ? "image/png,image/webp" : "image/png,image/jpeg,image/webp"}
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          className="min-w-0 flex-1 border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
          onClick={() => inputRef.current?.click()}
          title={
            variant === "decal"
              ? "Optional logo, shape, or light-leak plate above the hero texture."
              : "Optional brand photo or grain plate sampled full-viewport."
          }
        >
          {variant === "decal" ? "Upload overlay" : "Upload hero texture"}
        </button>
        {hasSlot ? (
          <button
            type="button"
            className="shrink-0 border border-white/35 px-2 py-2 text-[10px] uppercase tracking-wide text-zinc-400 transition hover:border-white hover:text-white"
            onClick={clearSlot}
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
