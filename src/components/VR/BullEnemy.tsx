import { useRef, useEffect } from "react";
import { type Mesh, type MeshStandardMaterial } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";

interface BullEnemyProps {
  id: string;
}

export default function BullEnemy({ id }: BullEnemyProps) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const { camera } = useThree();

  useEffect(() => {
    useGameStore.getState().setEnemyMesh(id, meshRef.current);
    return () => useGameStore.getState().setEnemyMesh(id, null);
  }, [id]);

  useFrame((_, deltaT) => {
    const store = useGameStore.getState();
    store.tickEnemy(id, deltaT, camera.position.y);

    const enemy = store.enemies.get(id);
    if (!enemy) return;

    if (meshRef.current) {
      meshRef.current.position.copy(enemy.position);
    }

    if (matRef.current) {
      matRef.current.color.set(
        enemy.mode === "attack" ? "#ff0000" : "#ffcc00"
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
