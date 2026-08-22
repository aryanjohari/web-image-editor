#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_opacity;
// 0=normal, 1=multiply, 2=screen, 3=overlay (approx without dst sample)
uniform int u_blendMode;
uniform int u_isBase;
/** 1 = apply Tier A grade chain (main only). */
uniform int u_enableGrade;

uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_fade;
uniform float u_duotone;
uniform float u_vignette;
uniform float u_grain;
uniform vec3 u_duotoneShadow;
uniform vec3 u_duotoneHighlight;

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

// Stable UV hash (no time) — OPEN grain-seed default for I1.
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 applyGrade(vec3 rgb, vec2 uv) {
  // exposure → contrast → saturation → temperature → fade|duotone → vignette → grain
  if (abs(u_exposure) > 1e-5) {
    rgb *= pow(2.0, u_exposure);
  }

  if (abs(u_contrast) > 1e-5) {
    rgb = mix(vec3(0.5), rgb, 1.0 + u_contrast);
  }

  if (abs(u_saturation) > 1e-5) {
    float y = luma709(rgb);
    rgb = mix(vec3(y), rgb, 1.0 + u_saturation);
  }

  if (abs(u_temperature) > 1e-5) {
    rgb.r += u_temperature * 0.12;
    rgb.b -= u_temperature * 0.12;
  }

  if (u_fade > 1e-5) {
    // OPEN fade default: lift toward light gray (soft blacks).
    rgb = mix(rgb, vec3(0.92), u_fade * 0.35) + u_fade * 0.04;
  }

  if (u_duotone > 1e-5) {
    float y = clamp(luma709(rgb), 0.0, 1.0);
    vec3 mapped = mix(u_duotoneShadow, u_duotoneHighlight, y);
    rgb = mix(rgb, mapped, u_duotone);
  }

  if (u_vignette > 1e-5) {
    vec2 d = uv - vec2(0.5);
    float r = length(d) * 1.41421356;
    float falloff = smoothstep(0.35, 1.05, r);
    rgb *= 1.0 - falloff * u_vignette;
  }

  if (u_grain > 1e-5) {
    float n = hash21(uv * vec2(1024.0, 768.0)) - 0.5;
    rgb += n * u_grain * 0.22;
  }

  return clamp(rgb, 0.0, 1.0);
}

void main() {
  // Top-left image/canvas uploads → flip V for WebGL's bottom-left texel origin.
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec4 src = texture(u_tex, uv);
  vec3 straight = src.rgb;

  if (u_enableGrade == 1 && src.a > 0.0) {
    straight = applyGrade(straight, uv);
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
