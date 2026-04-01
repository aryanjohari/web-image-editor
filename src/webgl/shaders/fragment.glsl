precision highp float;

uniform sampler2D u_texture;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_imageResolution;
uniform vec2 u_texSize;
uniform float u_meltIntensity;
uniform float u_colorBleed;
uniform float u_noiseLevel;
uniform float u_posterizeSteps;
uniform vec2 u_maskCenter;
uniform float u_maskRadius;
uniform float u_twirlIntensity;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_duotoneBlend;

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

vec2 applyTwirl(vec2 uv, vec2 center, float intensity) {
  vec2 offset = uv - center;
  float dist = length(offset);
  float angle = dist * intensity;
  float s = sin(angle);
  float c = cos(angle);
  mat2 rot = mat2(c, -s, s, c);
  return center + rot * offset;
}

vec3 applyDuotone(vec3 color, vec3 cA, vec3 cB, float blend) {
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 mappedColor = mix(cA, cB, luminance);
  return mix(color, mappedColor, blend);
}

void main() {
  // object-fit: contain — entire image visible; letterbox (black) outside centered content rect
  vec2 canvas = max(u_resolution, vec2(1.0));
  vec2 image = max(u_imageResolution, vec2(1.0));
  float canvasAspect = canvas.x / canvas.y;
  float imageAspect = image.x / image.y;
  float containScale;
  if (canvasAspect > imageAspect) {
    containScale = canvas.y / image.y;
  } else {
    containScale = canvas.x / image.x;
  }
  vec2 canvasCoord = v_uv * canvas;
  vec2 center = canvas * 0.5;
  vec2 halfContent = image * containScale * 0.5;
  vec2 delta = canvasCoord - center;

  if (abs(delta.x) > halfContent.x || abs(delta.y) > halfContent.y) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 baseUV = delta / (image * containScale) + 0.5;
  float mask = smoothstep(u_maskRadius, u_maskRadius - 0.1, distance(baseUV, u_maskCenter));
  vec2 distortedUV = applyTwirl(spaceDistortion(baseUV), u_maskCenter, u_twirlIntensity);
  vec2 finalUV = mix(baseUV, distortedUV, mask);
  vec4 texel = texture2D(u_texture, finalUV);
  vec3 rgb = colorMutation(texel.rgb);
  rgb = applyDuotone(rgb, u_colorA, u_colorB, u_duotoneBlend);
  float grain = proceduralNoise(v_uv);
  rgb += vec3(grain);
  rgb = clamp(rgb, 0.0, 1.0);
  gl_FragColor = vec4(rgb, texel.a);
}
