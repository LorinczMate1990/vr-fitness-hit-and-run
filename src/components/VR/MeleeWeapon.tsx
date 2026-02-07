import { useRef, useMemo, useEffect } from "react";
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
import vertexShader from "../../../shaders/common/vertex.glsl";
import fragmentShader from "../../../shaders/melee-weapon/fragment.glsl";
import { useGameStore } from "../../stores/gameStore";

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

  function getCrossSection(scale: number, pointsPerSide: number): Vector3[] {
    const points: Vector3[] = [];
    const w = baseWidth * scale * 0.5;
    const d = baseDepth * scale * 0.5;
    const curve = 0.3;

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
        const mid = new Vector3().lerpVectors(start, end, t);
        const curveAmount = Math.sin(t * Math.PI) * curve * scale;
        mid.multiplyScalar(1 - curveAmount * 0.3);
        points.push(mid);
      }
    }

    return points;
  }

  const pointsPerSide = curveSegments;
  const totalCrossPoints = pointsPerSide * 4;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = -t * length;
    const scale = 1 - t * 0.95;

    const crossSection = getCrossSection(scale, pointsPerSide);

    for (let j = 0; j < crossSection.length; j++) {
      const p = crossSection[j];
      positions.push(p.x, y, p.z);
      uvs.push(j / crossSection.length, t);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < totalCrossPoints; j++) {
      const curr = i * totalCrossPoints + j;
      const next = i * totalCrossPoints + ((j + 1) % totalCrossPoints);
      const currBelow = (i + 1) * totalCrossPoints + j;
      const nextBelow = (i + 1) * totalCrossPoints + ((j + 1) % totalCrossPoints);

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

interface MeleeWeaponProps {
  id: string;
}

export default function MeleeWeapon({ id }: MeleeWeaponProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0 },
    }),
    []
  );

  const bladeGeometry = useMemo(
    () => createBladeGeometry(0.0625, 0.0375, 0.5, 24, 5),
    []
  );

  useEffect(() => {
    const store = useGameStore.getState();
    store.registerWeapon(id);
    store.setWeaponMesh(id, meshRef.current);
    return () => useGameStore.getState().unregisterWeapon(id);
  }, [id]);

  useFrame((_, delta) => {
    // Shader time
    timeRef.current += delta;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = timeRef.current;
    }

    // Tick weapon logic (collision detection, speed calc) in store
    const store = useGameStore.getState();
    store.tickWeapon(id, delta);

    // Read speed from store for shader
    const weapon = store.weapons.get(id);
    if (matRef.current && weapon) {
      matRef.current.uniforms.uSpeed.value = weapon.speedNormalized;
    }
  });

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
