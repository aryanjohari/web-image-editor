#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_opacity;
// 0=normal, 1=multiply, 2=screen, 3=overlay (approx without dst sample)
uniform int u_blendMode;
uniform int u_isBase;

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

void main() {
  // Top-left image/canvas uploads → flip V for WebGL's bottom-left texel origin.
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec4 src = texture(u_tex, uv);
  float a = src.a * u_opacity;
  vec3 rgb = src.rgb * u_opacity;

  if (u_isBase == 1 || u_blendMode == 0) {
    outColor = vec4(rgb, a);
    return;
  }

  vec3 straight;
  if (a > 0.0) {
    straight = rgb / a;
  } else {
    straight = vec3(0.0);
  }
  if (u_blendMode == 1) {
    straight = blendMultiply(vec3(1.0), straight);
  } else if (u_blendMode == 2) {
    straight = blendScreen(vec3(0.0), straight);
  } else if (u_blendMode == 3) {
    straight = blendOverlay(vec3(0.5), straight);
  }
  outColor = vec4(straight * a, a);
}
