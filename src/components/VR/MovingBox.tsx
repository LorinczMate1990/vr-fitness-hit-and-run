import { useEffect, useRef } from "react";
import type { Mesh } from "three";

interface MovingBoxProps {
  deltaT: number;
  meshRef: React.RefObject<Mesh | null>;
}

export default function MovingBox({ deltaT, meshRef }: MovingBoxProps) {
  const elapsed = useRef(0);

  useEffect(() => {
    elapsed.current += deltaT;
    if (meshRef.current) {
      meshRef.current.position.z = -3 + Math.sin(elapsed.current) * 2;
    }
  }, [deltaT, meshRef]);

  return (
    <mesh ref={meshRef} position={[-1.2, 1, -3]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#4361ee" />
    </mesh>
  );
}
