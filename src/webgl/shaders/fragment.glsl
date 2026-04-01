precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_decalTexture;
uniform vec3 u_decalTransform;
uniform float u_linkDecalToMath;
uniform sampler2D u_textTexture;
uniform vec3 u_textTransform;
uniform float u_linkTextToMath;
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
uniform float u_colorCycleSpeed;
uniform float u_halftone;
uniform float u_scanline;

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
  float lfo = sin(u_time * u_colorCycleSpeed);
  float t = clamp(luminance + lfo * 0.25, 0.0, 1.0);
  vec3 mappedColor = mix(cA, cB, t);
  return mix(color, mappedColor, blend);
}

vec3 applyHalftone(vec3 color, vec2 uv, float resolution, float intensity) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  float dots = sin(uv.x * resolution * 0.5) * sin(uv.y * resolution * 0.5);
  vec3 halftoneColor = mix(vec3(0.0), vec3(1.0), step(dots, luma));
  return mix(color, halftoneColor, intensity);
}

vec3 applyScanlines(vec3 color, vec2 uv, float resolution, float intensity) {
  float lines = 0.5 + 0.5 * sin(uv.y * resolution * 1.5);
  return mix(color, color * lines, intensity);
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
  vec3 baseRgb = texel.rgb;
  vec3 rgb = colorMutation(baseRgb);
  rgb = applyDuotone(rgb, u_colorA, u_colorB, u_duotoneBlend);
  rgb = applyHalftone(rgb, finalUV, u_resolution.y, u_halftone);
  rgb = applyScanlines(rgb, finalUV, u_resolution.y, u_scanline);
  float grain = proceduralNoise(v_uv);
  rgb += vec3(grain);
  vec3 bgRgb = clamp(rgb, 0.0, 1.0);

  vec2 targetGridForDecal = mix(baseUV, finalUV, u_linkDecalToMath);
  float decalScale = max(u_decalTransform.z, 0.0001);
  vec2 decalUV =
    (targetGridForDecal - vec2(u_decalTransform.x, u_decalTransform.y) - 0.5) / decalScale + 0.5;
  vec4 decalPixel = texture2D(u_decalTexture, decalUV);
  if (decalUV.x < 0.0 || decalUV.x > 1.0 || decalUV.y < 0.0 || decalUV.y > 1.0) {
    decalPixel.a = 0.0;
  }

  vec3 withDecal = mix(bgRgb, decalPixel.rgb, decalPixel.a);

  vec2 targetGridForText = mix(baseUV, finalUV, u_linkTextToMath);
  float textLayerScale = max(u_textTransform.z, 0.0001);
  vec2 textUV =
    (targetGridForText - vec2(u_textTransform.x, u_textTransform.y) - 0.5) / textLayerScale + 0.5;
  vec4 textPixel = texture2D(u_textTexture, textUV);
  if (textUV.x < 0.0 || textUV.x > 1.0 || textUV.y < 0.0 || textUV.y > 1.0) {
    textPixel.a = 0.0;
  }

  vec3 compositedRgb = mix(withDecal, textPixel.rgb, textPixel.a);
  gl_FragColor = vec4(compositedRgb, 1.0);
}
