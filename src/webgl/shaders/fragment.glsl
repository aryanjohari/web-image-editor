precision highp float;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_texSize;
uniform float u_meltIntensity;
uniform float u_colorBleed;
uniform float u_noiseLevel;
uniform float u_posterizeSteps;

varying vec2 v_uv;

// --- proceduralNoise: film grain driven by u_noiseLevel and animated u_time ---
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float proceduralNoise(vec2 uv) {
  float level = max(u_noiseLevel, 0.0);
  if (level <= 0.0001) {
    return 0.0;
  }
  float t = u_time;
  vec2 q = uv * u_resolution.xy * 0.75 + vec2(t * 47.13, t * 31.97);
  float n = hash21(floor(q)) + hash21(floor(q + vec2(1.0, 0.0))) * 0.5;
  n = n * 2.0 - 1.0;
  return n * level;
}

// --- spaceDistortion: UV melt via trig waves scaled by u_meltIntensity + u_time ---
vec2 spaceDistortion(vec2 uv) {
  float m = max(u_meltIntensity, 0.0);
  if (m <= 0.0001) {
    return uv;
  }
  float t = u_time;
  float ax = uv.x * 6.2831853 * 8.0;
  float ay = uv.y * 6.2831853 * 8.0;
  float w1 = sin(ay + t * 2.1) * cos(ax * 0.5 + t * 1.3);
  float w2 = cos(ax + t * 1.7) * sin(ay * 0.5 - t * 0.9);
  vec2 offset = vec2(w1, w2) * m * 0.06;
  return uv + offset;
}

// --- colorMutation: channel cross-talk matrix (u_colorBleed) + posterize (u_posterizeSteps) ---
vec3 colorMutation(vec3 col) {
  float bleed = clamp(u_colorBleed, 0.0, 1.0);
  float steps = clamp(u_posterizeSteps, 2.0, 256.0);

  mat3 bleedMat = mat3(
    1.0 - bleed * 0.35, bleed * 0.2, bleed * 0.15,
    bleed * 0.15, 1.0 - bleed * 0.35, bleed * 0.2,
    bleed * 0.2, bleed * 0.15, 1.0 - bleed * 0.35
  );
  col = clamp(bleedMat * col, 0.0, 1.0);

  col = floor(col * steps + 0.00001) / steps;
  return clamp(col, 0.0, 1.0);
}

void main() {
  vec2 uv = spaceDistortion(v_uv);
  vec4 texel = texture2D(u_texture, uv);
  vec3 rgb = colorMutation(texel.rgb);
  float grain = proceduralNoise(v_uv);
  rgb += vec3(grain);
  rgb = clamp(rgb, 0.0, 1.0);
  gl_FragColor = vec4(rgb, texel.a);
}
