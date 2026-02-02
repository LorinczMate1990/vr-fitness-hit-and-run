import { useEffect, useRef } from "react";
import { Vector3, Color, type MeshStandardMaterial } from "three";

interface MeleeWeaponProps {
  position: [number, number, number];
  deltaT: number;
}

// Typical human punch/swing speed tops out around 10 m/s
const MAX_SPEED = 10;

const colorGreen = new Color("#00ff00");
const colorRed = new Color("#ff0000");

export default function MeleeWeapon({ position, deltaT }: MeleeWeaponProps) {
  const prevPos = useRef(new Vector3(...position));
  const matRef = useRef<MeshStandardMaterial>(null);

  useEffect(() => {
    const curr = new Vector3(...position);
    if (deltaT > 0 && matRef.current) {
      const speed = curr.distanceTo(prevPos.current) / deltaT;
      const t = Math.min(speed / MAX_SPEED, 1);
      matRef.current.color.copy(colorGreen).lerp(colorRed, t);
    }
    prevPos.current.copy(curr);
  }, [position, deltaT]);

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.035, 24, 24]} />
      <meshStandardMaterial ref={matRef} color="#00ff00" />
    </mesh>
  );
}
