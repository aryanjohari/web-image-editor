#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_tex;
uniform sampler2D u_mask;
uniform float u_opacity;
// 0=normal, 1=multiply, 2=screen, 3=overlay (approx without dst sample)
uniform int u_blendMode;
uniform int u_isBase;
/** 1 = apply Tier A grade chain (main only). */
uniform int u_enableGrade;
/** 1 = dual regional grade with u_mask mix (main + maskRef). */
uniform int u_regionalGrade;

uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_fade;
uniform float u_duotone;
uniform float u_vignette;
uniform float u_grain;
uniform float u_grainSeed;
uniform float u_grainSize;
uniform vec3 u_duotoneShadow;
uniform vec3 u_duotoneHighlight;

uniform float u_subject_exposure;
uniform float u_subject_contrast;
uniform float u_subject_saturation;
uniform float u_subject_temperature;
uniform float u_subject_fade;
uniform float u_subject_duotone;
uniform float u_subject_vignette;
uniform float u_subject_grain;
uniform float u_subject_grainSeed;
uniform float u_subject_grainSize;
uniform vec3 u_subject_duotoneShadow;
uniform vec3 u_subject_duotoneHighlight;

uniform float u_background_exposure;
uniform float u_background_contrast;
uniform float u_background_saturation;
uniform float u_background_temperature;
uniform float u_background_fade;
uniform float u_background_duotone;
uniform float u_background_vignette;
uniform float u_background_grain;
uniform float u_background_grainSeed;
uniform float u_background_grainSize;
uniform vec3 u_background_duotoneShadow;
uniform vec3 u_background_duotoneHighlight;

out vec4 outColor;

vec3 blendMultiply(vec3 b, vec3 s) { return b * s; }
vec3 blendScreen(vec3 b, vec3 s) { return 1.0 - (1.0 - b) * (1.0 - s); }
float blendOverlayChannel(float b, float s) {
  if (b < 0.5) {
    return 2.0 * b * s;
  }
  return 1.0 - 2.0 * (1.0 - b) * (1.0 - s);
}
vec3 blendOverlay(vec3 b, vec3 s) {
  return vec3(
    blendOverlayChannel(b.r, s.r),
    blendOverlayChannel(b.g, s.g),
    blendOverlayChannel(b.b, s.b)
  );
}

float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 applyGradeParams(
  vec3 rgb,
  vec2 uv,
  float exposure,
  float contrast,
  float saturation,
  float temperature,
  float fade,
  float duotone,
  float vignette,
  float grain,
  float grainSeed,
  float grainSize,
  vec3 duotoneShadow,
  vec3 duotoneHighlight
) {
  if (abs(exposure) > 1e-5) {
    rgb *= pow(2.0, exposure);
  }

  if (abs(contrast) > 1e-5) {
    rgb = mix(vec3(0.5), rgb, 1.0 + contrast);
  }

  if (abs(saturation) > 1e-5) {
    float y = luma709(rgb);
    rgb = mix(vec3(y), rgb, 1.0 + saturation);
  }

  if (abs(temperature) > 1e-5) {
    rgb.r += temperature * 0.12;
    rgb.b -= temperature * 0.12;
  }

  if (fade > 1e-5) {
    rgb = mix(rgb, vec3(0.92), fade * 0.35) + fade * 0.04;
  }

  if (duotone > 1e-5) {
    float y = clamp(luma709(rgb), 0.0, 1.0);
    vec3 mapped = mix(duotoneShadow, duotoneHighlight, y);
    rgb = mix(rgb, mapped, duotone);
  }

  if (vignette > 1e-5) {
    vec2 d = uv - vec2(0.5);
    float r = length(d) * 1.41421356;
    float falloff = smoothstep(0.35, 1.05, r);
    rgb *= 1.0 - falloff * vignette;
  }

  if (grain > 1e-5) {
    // size 0 → fine (~2048), size 1 → coarse (~256); default mid ≈ 0.5
    float gScale = mix(2048.0, 256.0, clamp(grainSize, 0.0, 1.0));
    float n = hash21(uv * vec2(gScale, gScale * 0.75) + vec2(grainSeed * 17.0, grainSeed * 31.0)) - 0.5;
    rgb += n * grain * 0.22;
  }

  return clamp(rgb, 0.0, 1.0);
}

vec3 applyGlobalGrade(vec3 rgb, vec2 uv) {
  return applyGradeParams(
    rgb,
    uv,
    u_exposure,
    u_contrast,
    u_saturation,
    u_temperature,
    u_fade,
    u_duotone,
    u_vignette,
    u_grain,
    u_grainSeed,
    u_grainSize,
    u_duotoneShadow,
    u_duotoneHighlight
  );
}

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec4 src = texture(u_tex, uv);
  vec3 straight = src.rgb;

  if (u_regionalGrade == 1 && src.a > 0.0) {
    float w = texture(u_mask, uv).r;
    vec3 gSub = applyGradeParams(
      straight,
      uv,
      u_subject_exposure,
      u_subject_contrast,
      u_subject_saturation,
      u_subject_temperature,
      u_subject_fade,
      u_subject_duotone,
      u_subject_vignette,
      u_subject_grain,
      u_subject_grainSeed,
      u_subject_grainSize,
      u_subject_duotoneShadow,
      u_subject_duotoneHighlight
    );
    vec3 gBg = applyGradeParams(
      straight,
      uv,
      u_background_exposure,
      u_background_contrast,
      u_background_saturation,
      u_background_temperature,
      u_background_fade,
      u_background_duotone,
      u_background_vignette,
      u_background_grain,
      u_background_grainSeed,
      u_background_grainSize,
      u_background_duotoneShadow,
      u_background_duotoneHighlight
    );
    straight = mix(gBg, gSub, w);
  } else if (u_enableGrade == 1 && src.a > 0.0) {
    straight = applyGlobalGrade(straight, uv);
  }

  float a = src.a * u_opacity;
  vec3 rgb = straight * a;

  if (u_isBase == 1 || u_blendMode == 0) {
    outColor = vec4(rgb, a);
    return;
  }

  vec3 s = a > 0.0 ? rgb / a : vec3(0.0);
  if (u_blendMode == 1) {
    s = blendMultiply(vec3(1.0), s);
  } else if (u_blendMode == 2) {
    s = blendScreen(vec3(0.0), s);
  } else if (u_blendMode == 3) {
    s = blendOverlay(vec3(0.5), s);
  }
  outColor = vec4(s * a, a);
}
