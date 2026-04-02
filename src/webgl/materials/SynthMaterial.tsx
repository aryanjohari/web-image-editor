import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Color,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
} from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { LayerEffectParams } from "@/store/layerEffects";
import { useSynthStore } from "@/store/useSynthStore";
import { createTextTexture } from "@/utils/textUtils";
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

const transparentFallbackTexture = new DataTexture(
  new Uint8Array([0, 0, 0, 0]),
  1,
  1,
  RGBAFormat,
  UnsignedByteType,
);
transparentFallbackTexture.generateMipmaps = false;
transparentFallbackTexture.minFilter = LinearFilter;
transparentFallbackTexture.magFilter = LinearFilter;
transparentFallbackTexture.colorSpace = SRGBColorSpace;
transparentFallbackTexture.needsUpdate = true;

function applyLayerUniforms(
  mat: ShaderMaterial,
  prefix: "L0" | "L1" | "L2",
  p: LayerEffectParams,
  baseTime: number,
) {
  const t = baseTime * p.timeScale;
  const u = mat.uniforms;
  u[`u_${prefix}_t`].value = t;
  u[`u_${prefix}_melt`].value = p.meltIntensity;
  u[`u_${prefix}_bleed`].value = p.colorBleed;
  u[`u_${prefix}_noise`].value = p.noiseLevel;
  u[`u_${prefix}_posterize`].value = p.posterizeSteps;
  (u[`u_${prefix}_maskCenter`].value as Vector2).set(p.maskCenterX, p.maskCenterY);
  u[`u_${prefix}_maskRadius`].value = p.maskRadius;
  u[`u_${prefix}_twirl`].value = p.twirlIntensity;
  (u[`u_${prefix}_colorA`].value as Color).setStyle(p.colorA);
  (u[`u_${prefix}_colorB`].value as Color).setStyle(p.colorB);
  u[`u_${prefix}_duotoneBlend`].value = p.duotoneBlend;
  u[`u_${prefix}_colorCycle`].value = p.colorCycleSpeed;
  u[`u_${prefix}_halftone`].value = p.halftoneIntensity;
  u[`u_${prefix}_scanline`].value = p.scanlineIntensity;
}

function seedLayerUniforms(prefix: "L0" | "L1" | "L2", p: LayerEffectParams, baseTime: number) {
  const t = baseTime * p.timeScale;
  return {
    [`u_${prefix}_t`]: { value: t },
    [`u_${prefix}_melt`]: { value: p.meltIntensity },
    [`u_${prefix}_bleed`]: { value: p.colorBleed },
    [`u_${prefix}_noise`]: { value: p.noiseLevel },
    [`u_${prefix}_posterize`]: { value: p.posterizeSteps },
    [`u_${prefix}_maskCenter`]: { value: new Vector2(p.maskCenterX, p.maskCenterY) },
    [`u_${prefix}_maskRadius`]: { value: p.maskRadius },
    [`u_${prefix}_twirl`]: { value: p.twirlIntensity },
    [`u_${prefix}_colorA`]: { value: new Color(p.colorA) },
    [`u_${prefix}_colorB`]: { value: new Color(p.colorB) },
    [`u_${prefix}_duotoneBlend`]: { value: p.duotoneBlend },
    [`u_${prefix}_colorCycle`]: { value: p.colorCycleSpeed },
    [`u_${prefix}_halftone`]: { value: p.halftoneIntensity },
    [`u_${prefix}_scanline`]: { value: p.scanlineIntensity },
  };
}

export function SynthMaterial() {
  const materialRef = useRef<ShaderMaterial>(null);
  const textTextureRef = useRef<CanvasTexture | null>(null);
  const { size } = useThree();
  const imageTexture = useSynthStore((s) => s.imageTexture);
  const overlayText = useSynthStore((s) => s.overlayText);
  const textColor = useSynthStore((s) => s.textColor);
  const textSize = useSynthStore((s) => s.textSize);

  const uniforms = useMemo(() => {
    const s = useSynthStore.getState();
    const le = s.layerEffects;
    const baseTime = 0;
    return {
      u_resolution: { value: new Vector2(size.width, size.height) },
      u_imageResolution: {
        value: new Vector2(
          s.imageResolution.width,
          s.imageResolution.height,
        ),
      },
      u_texture: { value: imageTexture ?? fallbackTexture },
      u_decalTexture: { value: transparentFallbackTexture },
      u_decalTransform: { value: new Vector3(s.decalOffsetX, s.decalOffsetY, s.decalScale) },
      u_linkDecalToMath: { value: s.linkDecalToMath ? 1.0 : 0.0 },
      u_textTexture: { value: transparentFallbackTexture },
      u_textTransform: { value: new Vector3(s.textOffsetX, s.textOffsetY, s.textScale) },
      u_linkTextToMath: { value: s.linkTextToMath ? 1.0 : 0.0 },
      ...seedLayerUniforms("L0", le.background, baseTime),
      ...seedLayerUniforms("L1", le.decal, baseTime),
      ...seedLayerUniforms("L2", le.text, baseTime),
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

  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;

    textTextureRef.current?.dispose();
    textTextureRef.current = null;

    const nextText = overlayText.trim();
    if (nextText.length > 0) {
      const generated = createTextTexture(nextText, size.width, size.height, textColor, textSize);
      if (generated) {
        textTextureRef.current = generated;
        mat.needsUpdate = true;
        return;
      }
    }

    mat.needsUpdate = true;
  }, [overlayText, textColor, textSize, size.width, size.height]);

  useEffect(() => {
    return () => {
      textTextureRef.current?.dispose();
      textTextureRef.current = null;
    };
  }, []);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;

    const synth = useSynthStore.getState();
    const le = synth.layerEffects;

    const exportTime = (window as Window & { __SYNTH_EXPORT_TIME__?: number })
      .__SYNTH_EXPORT_TIME__;
    const baseTime = typeof exportTime === "number" ? exportTime : state.clock.elapsedTime;

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

    applyLayerUniforms(mat, "L0", le.background, baseTime);
    applyLayerUniforms(mat, "L1", le.decal, baseTime);
    applyLayerUniforms(mat, "L2", le.text, baseTime);

    const uploadedDecal = synth.decalTexture;
    const decalTex = uploadedDecal ?? transparentFallbackTexture;
    if (uploadedDecal) {
      uploadedDecal.needsUpdate = true;
    }
    mat.uniforms.u_decalTexture.value = decalTex;
    mat.uniforms.u_decalTransform.value.set(synth.decalOffsetX, synth.decalOffsetY, synth.decalScale);
    mat.uniforms.u_linkDecalToMath.value = synth.linkDecalToMath ? 1.0 : 0.0;

    const textTrimmed = synth.overlayText.trim();
    const generatedText = textTextureRef.current;
    const textTex =
      textTrimmed.length > 0 ? (generatedText ?? transparentFallbackTexture) : transparentFallbackTexture;
    if (generatedText) {
      generatedText.needsUpdate = true;
    }
    mat.uniforms.u_textTexture.value = textTex;

    const hasUploadedDecal = uploadedDecal != null;
    if (hasUploadedDecal) {
      mat.uniforms.u_textTransform.value.set(synth.textOffsetX, synth.textOffsetY, synth.textScale);
      mat.uniforms.u_linkTextToMath.value = synth.linkTextToMath ? 1.0 : 0.0;
    } else {
      mat.uniforms.u_textTransform.value.set(synth.decalOffsetX, synth.decalOffsetY, synth.decalScale);
      mat.uniforms.u_linkTextToMath.value = synth.linkDecalToMath ? 1.0 : 0.0;
    }
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
