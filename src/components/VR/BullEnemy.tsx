import { useRef, useEffect } from "react";
import { type Mesh, type MeshStandardMaterial } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";

export default function BullEnemy() {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const { camera } = useThree();

  useEffect(() => {
    useGameStore.getState().setBullEnemyMesh(meshRef.current);
    return () => useGameStore.getState().setBullEnemyMesh(null);
  }, []);

  useFrame((_, deltaT) => {
    const store = useGameStore.getState();
    store.tickBullEnemy(deltaT, camera.position.y);

    if (meshRef.current) {
      meshRef.current.position.copy(store.bullEnemy.position);
    }

    // Color based on state: red when attacking, yellow when fleeing
    if (matRef.current) {
      matRef.current.color.set(
        store.bullEnemy.mode === "attack" ? "#ff0000" : "#ffcc00"
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial ref={matRef} />
    </mesh>
  );
}
