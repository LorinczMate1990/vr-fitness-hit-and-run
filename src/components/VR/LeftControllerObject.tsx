import { useRef } from "react";
import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import type { Mesh } from "three";
import { useControllerCollision } from "../../hooks/VR/useControllerCollision";

interface LeftControllerObjectProps {
  deltaT: number;
  targetRef: React.RefObject<Mesh | null>;
}

export default function LeftControllerObject({ deltaT, targetRef }: LeftControllerObjectProps) {
  const controller = useXRInputSourceState("controller", "left");
  const meshRef = useRef<Mesh>(null);
  useControllerCollision(meshRef, targetRef, controller?.inputSource, deltaT);
  if (!controller) return null;
  return (
    <XRSpace space={controller.inputSource.gripSpace!}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.1, 0.1, 0.15]} />
        <meshStandardMaterial color="#2ecc71" />
      </mesh>
    </XRSpace>
  );
}
