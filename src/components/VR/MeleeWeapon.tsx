import { useRef, useMemo } from "react";
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
import vertexShader from "../../../shaders/melee-weapon/vertex.glsl?raw";
import fragmentShader from "../../../shaders/melee-weapon/fragment.glsl?raw";

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

export default function MeleeWeapon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const prevPos = useRef(new Vector3());
  const matRef = useRef<ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0 },
    }),
    []
  );

  // Create curved rhombus blade geometry: 6.25cm x 3.75cm base, 50cm length
  const bladeGeometry = useMemo(
    () => createBladeGeometry(0.0625, 0.0375, 0.5, 24, 5),
    []
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      timeRef.current += delta;
      matRef.current.uniforms.uTime.value = timeRef.current;
    }

    // Calculate speed from world position change
    if (meshRef.current && matRef.current && delta > 0) {
      const currPos = new Vector3();
      meshRef.current.getWorldPosition(currPos);

      const speed = currPos.distanceTo(prevPos.current) / delta;
      const t = Math.min(speed / MAX_SPEED, 1);
      matRef.current.uniforms.uSpeed.value = t;

      prevPos.current.copy(currPos);
    }
  });

  // Blade: 20cm length, curved rhombus base at controller, tip pointing down
  return (
    <mesh ref={meshRef} geometry={bladeGeometry}>
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
