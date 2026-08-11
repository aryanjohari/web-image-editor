import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { PackExportViewportBridge } from "@/components/PackExportViewportBridge";
import { SYNTH_CANVAS_ID } from "@/constants/synthCanvas";
import { SynthScene } from "@/webgl/SynthCanvas";

export function SynthCanvasView() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        id={SYNTH_CANVAS_ID}
        className="block h-full w-full touch-none"
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <OrthographicCamera
          makeDefault
          manual
          top={1}
          bottom={-1}
          left={-1}
          right={1}
          near={0.1}
          far={10}
          position={[0, 0, 1]}
        />
        <PackExportViewportBridge />
        <SynthScene />
      </Canvas>
    </div>
  );
}
