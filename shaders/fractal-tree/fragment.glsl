uniform float uTime;
uniform float uHealth;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

#include ../common/noise.glsl

void main() {
  // Colors based on health (blue healthy, red damaged)
  vec3 healthyCore = vec3(0.4, 0.7, 1.0);
  vec3 healthyEdge = vec3(0.1, 0.4, 1.0);
  vec3 damagedCore = vec3(1.0, 0.5, 0.3);
  vec3 damagedEdge = vec3(1.0, 0.2, 0.1);

  float damage = 1.0 - uHealth;
  vec3 coreColor = mix(healthyCore, damagedCore, damage);
  vec3 edgeColor = mix(healthyEdge, damagedEdge, damage);

  // Use normal for depth shading
  float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
  float coreMask = smoothstep(0.3, 0.8, facing);

  // Electric effects
  float t = uTime * 12.0;
  float electric1 = electricNoise(vUv * vec2(5.0, 15.0), t);
  float electric2 = electricNoise(vUv * vec2(8.0, 25.0), t * 1.3);
  float electric3 = step(0.75, electricNoise(vUv * vec2(3.0, 30.0), t * 2.0));

  float electricEffect = electric1 * 0.4 + electric2 * 0.3 + electric3 * 0.3;
  electricEffect *= (1.0 - coreMask) * 0.8;

  // Pulsing glow
  float pulse = 0.8 + 0.2 * sin(uTime * 3.0 + vUv.y * 10.0);

  // Arc flashes
  float arc = step(0.94, hash(vec2(floor(uTime * 15.0), floor(vUv.y * 8.0))));
  arc *= 0.5;

  vec3 color = coreColor * coreMask + edgeColor * (electricEffect + arc);
  color *= pulse;

  float alpha = coreMask * 0.9 + electricEffect * 0.6 + arc;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(color * 1.4, alpha);
}
