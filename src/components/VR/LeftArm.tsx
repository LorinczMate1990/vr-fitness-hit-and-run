import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import { type Mesh } from "three";
import { useControllerCollision } from "../../hooks/VR/useControllerCollision";
import MeleeWeapon from "./MeleeWeapon";
import type { BullEnemyHandle } from "./BullEnemy";

interface LeftArmProps {
  deltaT: number;
  targetRef: React.RefObject<Mesh | null>;
  collisionMeshRef: React.RefObject<Mesh | null>;
  targets?: React.RefObject<BullEnemyHandle | null>[];
}

export default function LeftArm({ deltaT, targetRef, collisionMeshRef, targets = [] }: LeftArmProps) {
  const controller = useXRInputSourceState("controller", "left");

  useControllerCollision(
    collisionMeshRef,
    targetRef,
    controller?.inputSource,
    deltaT
  );

  if (!controller) return null;

  return (
    <XRSpace space={controller.inputSource.gripSpace!}>
      <mesh ref={collisionMeshRef} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.15]} />
      </mesh>
      <MeleeWeapon targets={targets} />
    </XRSpace>
  );
}
