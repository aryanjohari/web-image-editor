#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_tex;
/** Pixel step in UV: (1/w, 0) horizontal or (0, 1/h) vertical. */
uniform vec2 u_texel;
/** Blur radius in pixels (scaled by amount upstream). */
uniform float u_radius;

out vec4 outColor;

void main() {
  float r = max(u_radius, 0.0);
  if (r < 0.5) {
    outColor = texture(u_tex, v_uv);
    return;
  }
  // 9-tap binomial-ish separable kernel
  float w0 = 0.227027;
  float w1 = 0.1945946;
  float w2 = 0.1216216;
  float w3 = 0.054054;
  float w4 = 0.016216;
  vec2 step1 = u_texel * (r * 0.25);
  vec2 step2 = u_texel * (r * 0.5);
  vec2 step3 = u_texel * (r * 0.75);
  vec2 step4 = u_texel * r;
  vec4 c = texture(u_tex, v_uv) * w0;
  c += texture(u_tex, v_uv + step1) * w1;
  c += texture(u_tex, v_uv - step1) * w1;
  c += texture(u_tex, v_uv + step2) * w2;
  c += texture(u_tex, v_uv - step2) * w2;
  c += texture(u_tex, v_uv + step3) * w3;
  c += texture(u_tex, v_uv - step3) * w3;
  c += texture(u_tex, v_uv + step4) * w4;
  c += texture(u_tex, v_uv - step4) * w4;
  outColor = c;
}
