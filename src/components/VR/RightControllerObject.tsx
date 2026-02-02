import { useRef } from "react";
import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import type { Mesh } from "three";
import { useControllerCollision } from "../../hooks/VR/useControllerCollision";

interface RightControllerObjectProps {
  deltaT: number;
  targetRef: React.RefObject<Mesh | null>;
}

export default function RightControllerObject({ deltaT, targetRef }: RightControllerObjectProps) {
  const controller = useXRInputSourceState("controller", "right");
  const meshRef = useRef<Mesh>(null);
  useControllerCollision(meshRef, targetRef, controller?.inputSource, deltaT);
  if (!controller) return null;
  return (
    <XRSpace space={controller.inputSource.gripSpace!}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial color="#2ecc71" />
      </mesh>
    </XRSpace>
  );
}
