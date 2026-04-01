import { useRef, type ChangeEvent } from "react";
import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import { useSynthStore } from "@/store/useSynthStore";

const DEBUG = true;

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setImageTexture = useSynthStore((state) => state.setImageTexture);

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

        setImageTexture(texture);
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
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        className="w-full border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black"
        onClick={() => inputRef.current?.click()}
      >
        Upload Image
      </button>
    </div>
  );
}
