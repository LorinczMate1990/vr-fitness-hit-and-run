float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float electricNoise(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i + vec2(0.0, 0.0) + t);
  float b = hash(i + vec2(1.0, 0.0) + t * 1.1);
  float c = hash(i + vec2(0.0, 1.0) + t * 0.9);
  float d = hash(i + vec2(1.0, 1.0) + t * 1.2);

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
