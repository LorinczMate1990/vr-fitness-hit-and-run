uniform float uTime;
uniform float uSpeed;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

#include ../common/noise.glsl

void main() {
  // Base colors
  vec3 coldCore = vec3(0.6, 0.8, 1.0);    // Light blue metallic core
  vec3 coldEdge = vec3(0.2, 0.5, 1.0);    // Blue electric
  vec3 hotCore = vec3(1.0, 0.7, 0.6);     // Light red metallic core
  vec3 hotEdge = vec3(1.0, 0.2, 0.1);     // Red electric

  vec3 coreColor = mix(coldCore, hotCore, uSpeed);
  vec3 edgeColor = mix(coldEdge, hotEdge, uSpeed);

  // Distance from center (0 = center, 1 = edge)
  float centerDist = abs(vUv.x - 0.5) * 2.0;

  // Sharp metallic core - solid and stable
  float coreMask = 1.0 - smoothstep(0.0, 0.4, centerDist);

  // Edge zone for electric effects
  float edgeZone = smoothstep(0.3, 0.5, centerDist) * (1.0 - smoothstep(0.5, 1.0, centerDist));

  // Fade at blade tip (base at vUv.y = 0, tip at vUv.y = 1)
  float tipFade = 1.0 - smoothstep(0.85, 1.0, vUv.y);

  // Electric flickering at edges - fast and sharp
  float t = uTime * 15.0;
  float electric1 = electricNoise(vUv * vec2(3.0, 20.0), t);
  float electric2 = electricNoise(vUv * vec2(5.0, 30.0), t * 1.3);
  float electric3 = step(0.7, electricNoise(vUv * vec2(2.0, 40.0), t * 2.0));

  float electricEffect = electric1 * 0.5 + electric2 * 0.3 + electric3 * 0.4;
  electricEffect *= edgeZone;

  // Occasional bright arc flashes
  float arc = step(0.92, hash(vec2(floor(uTime * 20.0), floor(vUv.y * 10.0))));
  arc *= edgeZone * 0.8;

  // Combine core and electric edge
  vec3 color = coreColor * coreMask + edgeColor * (electricEffect + arc);

  // Alpha: solid core, flickering edges
  float alpha = coreMask + electricEffect * 0.7 + arc;
  alpha *= tipFade;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(color * 1.3, alpha);
}
