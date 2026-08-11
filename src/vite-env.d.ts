/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Preferred Stage Phase 2 flag for brief → Gemini */
  readonly VITE_STAGE_BRIEF_AI_ENABLED?: string;
  /** Legacy alias — still honored when VITE_STAGE_BRIEF_AI_ENABLED unset */
  readonly VITE_MOOD_AI_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Set during WebM export loop; overrides scene clock for deterministic frames. */
  __SYNTH_EXPORT_TIME__?: number;
  /** Last `baseTime` used in SynthMaterial (export time override or clock.elapsedTime). */
  __SYNTH_LAST_BASE_TIME__?: number;
}

declare module "*.glsl" {
  const source: string;
  export default source;
}
