import { useRef } from "react";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

interface MovingBoxProps {
  meshRef: React.RefObject<Mesh | null>;
}

export default function MovingBox({ meshRef }: MovingBoxProps) {
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (meshRef.current) {
      meshRef.current.position.z = -3 + Math.sin(elapsed.current) * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={[-1.2, 1, -3]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#4361ee" />
    </mesh>
  );
}
