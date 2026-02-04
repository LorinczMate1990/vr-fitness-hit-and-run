import { useEffect, useRef, useMemo } from "react";
import {
  Vector3,
  ShaderMaterial,
  DoubleSide,
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
import { useFrame } from "@react-three/fiber";

interface MeleeWeaponProps {
  position: [number, number, number];
  deltaT: number;
}

// Typical human punch/swing speed tops out around 10 m/s
const MAX_SPEED = 10;

// Create curved rhombus blade geometry
function createBladeGeometry(
  baseWidth: number,
  baseDepth: number,
  length: number,
  segments: number = 16,
  curveSegments: number = 4
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Generate cross-section points for a curved rhombus
  // 4 corners with curved edges between them
  function getCrossSection(scale: number, pointsPerSide: number): Vector3[] {
    const points: Vector3[] = [];
    const w = baseWidth * scale * 0.5;
    const d = baseDepth * scale * 0.5;
    const curve = 0.3; // How much the sides curve inward (0 = straight, 1 = very curved)

    // 4 corners of rhombus: +X, +Z, -X, -Z
    const corners = [
      new Vector3(w, 0, 0),
      new Vector3(0, 0, d),
      new Vector3(-w, 0, 0),
      new Vector3(0, 0, -d),
    ];

    for (let i = 0; i < 4; i++) {
      const start = corners[i];
      const end = corners[(i + 1) % 4];

      for (let j = 0; j < pointsPerSide; j++) {
        const t = j / pointsPerSide;
        // Lerp between corners with inward curve
        const mid = new Vector3().lerpVectors(start, end, t);
        // Push toward center for curve effect
        const curveAmount = Math.sin(t * Math.PI) * curve * scale;
        mid.multiplyScalar(1 - curveAmount * 0.3);
        points.push(mid);
      }
    }

    return points;
  }

  const pointsPerSide = curveSegments;
  const totalCrossPoints = pointsPerSide * 4;

  // Generate vertices along blade length
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = -t * length; // Blade extends downward
    const scale = 1 - t * 0.95; // Taper to 5% at tip

    const crossSection = getCrossSection(scale, pointsPerSide);

    for (let j = 0; j < crossSection.length; j++) {
      const p = crossSection[j];
      positions.push(p.x, y, p.z);
      uvs.push(j / crossSection.length, t);
    }
  }

  // Generate indices for the faces
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < totalCrossPoints; j++) {
      const curr = i * totalCrossPoints + j;
      const next = i * totalCrossPoints + ((j + 1) % totalCrossPoints);
      const currBelow = (i + 1) * totalCrossPoints + j;
      const nextBelow = (i + 1) * totalCrossPoints + ((j + 1) % totalCrossPoints);

      // Two triangles per quad
      indices.push(curr, currBelow, next);
      indices.push(next, currBelow, nextBelow);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uSpeed;

  varying vec2 vUv;
  varying vec3 vPosition;

  // Hash function for electric noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Electric arc noise
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
`;

export default function MeleeWeapon({ position, deltaT }: MeleeWeaponProps) {
  const prevPos = useRef(new Vector3(...position));
  const matRef = useRef<ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0 },
    }),
    []
  );

  // Create curved rhombus blade geometry: 2.5cm x 1.5cm base, 20cm length
  const bladeGeometry = useMemo(
    () => createBladeGeometry(0.025, 0.015, 0.2, 20, 5),
    []
  );

  useFrame(() => {
    if (matRef.current) {
      timeRef.current += 0.016; // Approximate frame time for smooth animation
      matRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  useEffect(() => {
    const curr = new Vector3(...position);
    if (deltaT > 0 && matRef.current) {
      const speed = curr.distanceTo(prevPos.current) / deltaT;
      const t = Math.min(speed / MAX_SPEED, 1);
      matRef.current.uniforms.uSpeed.value = t;
    }
    prevPos.current.copy(curr);
  }, [position, deltaT]);

  // Blade: 20cm length, curved rhombus base at controller, tip pointing down
  return (
    <mesh position={position} geometry={bladeGeometry}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
