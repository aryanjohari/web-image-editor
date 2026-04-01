import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { StackPanel } from "@/components/controls/StackPanel";
import { useSynthStore } from "@/store/useSynthStore";
import { SynthScene } from "@/webgl/SynthCanvas";

export default function App() {
  const panelOpen = useSynthStore((state) => state.panelOpen);
  const setPanelOpen = useSynthStore((state) => state.setPanelOpen);

  return (
    <main className="relative flex h-screen w-screen min-h-0 min-w-0 overflow-hidden bg-black text-white">
      <div className="relative h-full min-h-0 min-w-0 flex-1">
        <Canvas
          className="h-full w-full"
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

      <aside className="h-full w-[320px] shrink-0 overflow-hidden border-l border-white/20 bg-zinc-950/90">
        <StackPanel />
      </aside>

      {!panelOpen && (
        <button
          type="button"
          className="absolute right-[328px] top-2 z-10 border border-white bg-black/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em]"
          onClick={() => setPanelOpen(true)}
        >
          Open Stack
        </button>
      )}
    </main>
  );
}
