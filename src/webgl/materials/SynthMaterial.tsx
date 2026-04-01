import { useEffect, useMemo, useRef } from "react";
import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  ShaderMaterial,
  Texture,
  UnsignedByteType,
  Vector2,
} from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useSynthStore } from "@/store/useSynthStore";
import vertexShader from "@/webgl/shaders/vertex.glsl";
import fragmentShader from "@/webgl/shaders/fragment.glsl";

const DEBUG = false;

const fallbackTexture = new DataTexture(
  new Uint8Array([0, 0, 0, 255]),
  1,
  1,
  RGBAFormat,
  UnsignedByteType,
);
fallbackTexture.generateMipmaps = false;
fallbackTexture.minFilter = LinearFilter;
fallbackTexture.magFilter = LinearFilter;
fallbackTexture.needsUpdate = true;

function textureBitmapDimensions(texture: Texture | null): [number, number] {
  const image = texture?.image;
  if (image && typeof image === "object" && "width" in image && "height" in image) {
    const w = (image as { width: number }).width;
    const h = (image as { height: number }).height;
    if (typeof w === "number" && typeof h === "number") return [w, h];
  }
  return [1, 1];
}

export function SynthMaterial() {
  const materialRef = useRef<ShaderMaterial>(null);
  const { size } = useThree();
  const imageTexture = useSynthStore((s) => s.imageTexture);

  const uniforms = useMemo(() => {
    const s = useSynthStore.getState();
    return {
      u_time: { value: 0 },
      u_resolution: { value: new Vector2(size.width, size.height) },
      u_imageResolution: {
        value: new Vector2(
          s.imageResolution.width,
          s.imageResolution.height,
        ),
      },
      u_texture: { value: imageTexture ?? fallbackTexture },
      u_texSize: { value: new Vector2(...textureBitmapDimensions(imageTexture)) },
      u_meltIntensity: { value: s.meltIntensity },
      u_colorBleed: { value: s.colorBleed },
      u_noiseLevel: { value: s.noiseLevel },
      u_posterizeSteps: { value: s.posterizeSteps },
    };
  }, [size.width, size.height, imageTexture]);

  useEffect(() => {
    if (materialRef.current && imageTexture) {
      if (DEBUG) {
        console.debug("[SynthMaterial] imageTexture -> u_texture assignment", {
          ts: new Date().toISOString(),
          imageTexture,
        });
      }
      materialRef.current.uniforms.u_texture.value = imageTexture;
      materialRef.current.needsUpdate = true;
    }
  }, [imageTexture]);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;

    const synth = useSynthStore.getState();

    mat.uniforms.u_time.value = state.clock.elapsedTime * synth.timeScale;
    mat.uniforms.u_resolution.value.set(state.size.width, state.size.height);
    mat.uniforms.u_imageResolution.value.set(
      synth.imageResolution.width,
      synth.imageResolution.height,
    );
    const tex = synth.imageTexture ?? fallbackTexture;
    if (synth.imageTexture) {
      synth.imageTexture.needsUpdate = true;
    }
    mat.uniforms.u_texture.value = tex;
    mat.uniforms.u_texSize.value.set(...textureBitmapDimensions(synth.imageTexture));
    mat.uniforms.u_meltIntensity.value = synth.meltIntensity;
    mat.uniforms.u_colorBleed.value = synth.colorBleed;
    mat.uniforms.u_noiseLevel.value = synth.noiseLevel;
    mat.uniforms.u_posterizeSteps.value = synth.posterizeSteps;
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
    />
  );
}
