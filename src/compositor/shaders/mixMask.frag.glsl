#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_sharp;
uniform sampler2D u_blurred;
uniform sampler2D u_mask;

out vec4 outColor;

void main() {
  // Match textured.frag mask UV flip (upload orientation).
  vec2 maskUv = vec2(v_uv.x, 1.0 - v_uv.y);
  float w = texture(u_mask, maskUv).r;
  vec4 sharp = texture(u_sharp, v_uv);
  vec4 blurred = texture(u_blurred, v_uv);
  // Subject (high w) stays sharp; background uses blurred.
  outColor = mix(blurred, sharp, w);
}
