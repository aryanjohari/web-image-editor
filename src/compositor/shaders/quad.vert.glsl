#version 300 es
precision highp float;

layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_uv;

uniform vec2 u_scale;
uniform vec2 u_offset;
uniform float u_rotation;

out vec2 v_uv;

void main() {
  float c = cos(u_rotation);
  float s = sin(u_rotation);
  vec2 p = a_pos * u_scale;
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  p += u_offset;
  v_uv = a_uv;
  gl_Position = vec4(p, 0.0, 1.0);
}
