import { useRef, useEffect } from "react";
import { type Mesh, type MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";
import type { BullEnemyActor } from "../../game/BullEnemyActor";

interface BullEnemyProps {
  id: string;
}

export default function BullEnemy({ id }: BullEnemyProps) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);

  useEffect(() => {
    const actor = useGameStore.getState().actors.get(id);
    if (actor) actor.mesh = meshRef.current;
    return () => {
      const a = useGameStore.getState().actors.get(id);
      if (a) a.mesh = null;
    };
  }, [id]);

  useFrame((_, deltaT) => {
    const actor = useGameStore.getState().actors.get(id) as
      | BullEnemyActor
      | undefined;
    if (!actor) return;

    actor.tick(deltaT);

    meshRef.current?.position.copy(actor.position);
    matRef.current?.color.set(
      actor.mode === "attack" ? "#ff0000" : "#ffcc00"
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial ref={matRef} />
    </mesh>
  );
}
