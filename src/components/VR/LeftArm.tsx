import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import { type Mesh } from "three";
import { useControllerCollision } from "../../hooks/VR/useControllerCollision";
import MeleeWeapon from "./MeleeWeapon";

interface LeftArmProps {
  targetRef: React.RefObject<Mesh | null>;
  collisionMeshRef: React.RefObject<Mesh | null>;
}

export default function LeftArm({ targetRef, collisionMeshRef }: LeftArmProps) {
  const controller = useXRInputSourceState("controller", "left");

  useControllerCollision(
    collisionMeshRef,
    targetRef,
    controller?.inputSource
  );

  if (!controller) return null;

  return (
    <XRSpace space={controller.inputSource.gripSpace!}>
      <mesh ref={collisionMeshRef} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.15]} />
      </mesh>
      <MeleeWeapon />
    </XRSpace>
  );
}
