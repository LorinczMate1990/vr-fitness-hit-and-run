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
import fragmentShader from "../../../shaders/fractal-tree/fragment.glsl";
import { useGameStore } from "../../stores/gameStore";
import { MIN_SCALE, MAX_SCALE } from "../../game/treeLogic";
import type { TreeActor } from "../../game/TreeActor";

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

export default function FractalTree() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHealth: { value: 1.0 },
    }),
    []
  );

  const treeGeometry = useMemo(() => createFractalTreeGeometry(4, 0.15, 0.02, 0.5, 0.7, 0.65), []);

  useEffect(() => {
    const actor = useGameStore.getState().actors.get("tree");
    if (actor) actor.mesh = meshRef.current;
    return () => {
      const a = useGameStore.getState().actors.get("tree");
      if (a) a.mesh = null;
    };
  }, []);

  useFrame((_, delta) => {
    const actor = useGameStore.getState().actors.get("tree") as TreeActor | undefined;
    if (!actor) return;

    actor.tick(delta);

    if (matRef.current) {
      timeRef.current += delta;
      matRef.current.uniforms.uTime.value = timeRef.current;

      const healthRatio = (actor.scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
      matRef.current.uniforms.uHealth.value = healthRatio;
    }

    if (meshRef.current) {
      meshRef.current.position.copy(actor.position);
      meshRef.current.scale.setScalar(actor.scale);
    }
  });

  return (
    <mesh ref={meshRef} geometry={treeGeometry}>
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
