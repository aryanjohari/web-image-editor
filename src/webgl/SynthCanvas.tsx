import { SynthMaterial } from "@/webgl/materials/SynthMaterial";
import { useSynthStore } from "@/store/useSynthStore";

export function SynthScene() {
  const imageTexture = useSynthStore((state) => state.imageTexture);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <SynthMaterial key={imageTexture ? imageTexture.uuid : "empty"} />
    </mesh>
  );
}
