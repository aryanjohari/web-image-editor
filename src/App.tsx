import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { ControlsDrawer } from "@/components/ControlsDrawer";
import { IdeasGallery } from "@/components/IdeasGallery";
import { SYNTH_CANVAS_ID } from "@/constants/synthCanvas";
import { SynthScene } from "@/webgl/SynthCanvas";

export default function App() {
  return (
    <main className="relative h-[100dvh] w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
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
          <SynthScene />
        </Canvas>
      </div>

      <details className="fixed left-3 top-3 z-[60] max-w-[min(calc(100vw-1.5rem),220px)] border border-white/35 bg-black/80 backdrop-blur-sm [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white/10">
          Ideas
        </summary>
        <div className="max-h-[min(70dvh,28rem)] overflow-y-auto overflow-x-hidden border-t border-white/20 p-2">
          <IdeasGallery variant="dropdown" />
        </div>
      </details>

      <ControlsDrawer />
    </main>
  );
}
