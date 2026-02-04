import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import {
  Vector3,
  ShaderMaterial,
  DoubleSide,
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
import { useFrame } from "@react-three/fiber";

export interface FractalTreeHandle {
  getPosition: () => Vector3;
  onHit: () => void;
}

interface FractalTreeProps {
  position: [number, number, number];
}

// Growth rate: scale units per second
const GROWTH_RATE = 0.02;
// How much growth is lost on hit (30 seconds worth)
const HIT_PENALTY = GROWTH_RATE * 30;
// Min and max scale
const MIN_SCALE = 0.3;
const MAX_SCALE = 2.0;

// Generate fractal tree geometry
function createFractalTreeGeometry(
  depth: number = 4,
  branchLength: number = 0.15,
  branchRadius: number = 0.02,
  angleSplit: number = 0.5,
  lengthDecay: number = 0.7,
  radiusDecay: number = 0.65
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexIndex = 0;

  const segmentsPerBranch = 6;
  const radialSegments = 6;

  function addBranch(
    start: Vector3,
    direction: Vector3,
    length: number,
    radius: number,
    currentDepth: number,
    uvYStart: number
  ) {
    const end = start.clone().add(direction.clone().multiplyScalar(length));
    const uvYEnd = uvYStart + (1 - uvYStart) * 0.3;

    // Create cylinder vertices for this branch
    const startIdx = vertexIndex;

    // Get perpendicular vectors for the circle
    const up = new Vector3(0, 1, 0);
    let perp1 = new Vector3().crossVectors(direction, up).normalize();
    if (perp1.length() < 0.1) {
      perp1 = new Vector3().crossVectors(direction, new Vector3(1, 0, 0)).normalize();
    }
    const perp2 = new Vector3().crossVectors(direction, perp1).normalize();

    // Generate rings along the branch
    for (let i = 0; i <= segmentsPerBranch; i++) {
      const t = i / segmentsPerBranch;
      const pos = start.clone().lerp(end, t);
      const r = radius * (1 - t * 0.3); // Slight taper
      const uvY = uvYStart + (uvYEnd - uvYStart) * t;

      for (let j = 0; j < radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const offset = perp1
          .clone()
          .multiplyScalar(Math.cos(angle) * r)
          .add(perp2.clone().multiplyScalar(Math.sin(angle) * r));

        const vertex = pos.clone().add(offset);
        positions.push(vertex.x, vertex.y, vertex.z);
        uvs.push(j / radialSegments, uvY);
        vertexIndex++;
      }
    }

    // Generate indices for this branch
    for (let i = 0; i < segmentsPerBranch; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const curr = startIdx + i * radialSegments + j;
        const next = startIdx + i * radialSegments + ((j + 1) % radialSegments);
        const currAbove = startIdx + (i + 1) * radialSegments + j;
        const nextAbove = startIdx + (i + 1) * radialSegments + ((j + 1) % radialSegments);

        indices.push(curr, currAbove, next);
        indices.push(next, currAbove, nextAbove);
      }
    }

    // Recursively add child branches
    if (currentDepth < depth) {
      const newLength = length * lengthDecay;
      const newRadius = radius * radiusDecay;

      // Create 2-3 child branches at different angles
      const numChildren = currentDepth < 2 ? 3 : 2;

      for (let i = 0; i < numChildren; i++) {
        const angleOffset = ((i - (numChildren - 1) / 2) * angleSplit * 2) / numChildren;

        // Rotate direction for child branch
        const rotAxis1 = perp1;
        const rotAxis2 = perp2;

        const childDir = direction
          .clone()
          .applyAxisAngle(rotAxis1, angleSplit + angleOffset * 0.5)
          .applyAxisAngle(rotAxis2, angleOffset)
          .normalize();

        addBranch(end, childDir, newLength, newRadius, currentDepth + 1, uvYEnd);
      }
    }
  }

  // Start with trunk going upward
  const trunkStart = new Vector3(0, 0, 0);
  const trunkDir = new Vector3(0, 1, 0);
  addBranch(trunkStart, trunkDir, branchLength * 1.5, branchRadius * 1.5, 0, 0);

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
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uHealth;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

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
`;

const FractalTree = forwardRef<FractalTreeHandle, FractalTreeProps>(
  ({ position }, ref) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<ShaderMaterial>(null);
    const timeRef = useRef(0);
    const scaleRef = useRef(1.0);
    const positionVec = useMemo(() => new Vector3(...position), [position]);

    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uHealth: { value: 1.0 },
      }),
      []
    );

    const treeGeometry = useMemo(() => createFractalTreeGeometry(4, 0.15, 0.02, 0.5, 0.7, 0.65), []);

    useImperativeHandle(ref, () => ({
      getPosition: () => positionVec,
      onHit: () => {
        scaleRef.current = Math.max(MIN_SCALE, scaleRef.current - HIT_PENALTY);
      },
    }));

    useFrame((_, delta) => {
      if (matRef.current) {
        timeRef.current += delta;
        matRef.current.uniforms.uTime.value = timeRef.current;

        // Health based on scale (for visual feedback)
        const healthRatio = (scaleRef.current - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
        matRef.current.uniforms.uHealth.value = healthRatio;
      }

      // Grow over time
      scaleRef.current = Math.min(MAX_SCALE, scaleRef.current + GROWTH_RATE * delta);

      // Apply scale to mesh
      if (meshRef.current) {
        meshRef.current.scale.setScalar(scaleRef.current);
      }
    });

    return (
      <mesh ref={meshRef} position={position} geometry={treeGeometry}>
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
);

FractalTree.displayName = "FractalTree";

export default FractalTree;
