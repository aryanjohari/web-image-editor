import { useRef, type ChangeEvent } from "react";
import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { useSynthStore } from "@/store/useSynthStore";
import { createProcessedDecalTexture } from "@/utils/decalTexture";

const DEBUG = true;

export type UploadButtonProps = {
  /** Background slot (full-frame image) vs sticker-book decal slot. */
  variant?: "background" | "decal";
};

export function UploadButton({ variant = "background" }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setImageTexture = useSynthStore((state) => state.setImageTexture);
  const setDecalTexture = useSynthStore((state) => state.setDecalTexture);
  const applyTexture = variant === "decal" ? setDecalTexture : setImageTexture;

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

  return (
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
        className="w-full border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={() => inputRef.current?.click()}
      >
        {variant === "decal" ? "Upload Decal" : "Upload Image"}
      </button>
    </div>
  );
}
