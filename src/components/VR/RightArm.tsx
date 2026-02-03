import { useRef } from "react";
import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import { Vector3, type Mesh, type Group } from "three";
import { useControllerCollision } from "../../hooks/VR/useControllerCollision";
import MeleeWeapon from "./MeleeWeapon";

interface RightArmProps {
  deltaT: number;
  targetRef: React.RefObject<Mesh | null>;
  collisionMeshRef: React.RefObject<Mesh | null>;
}

export default function RightArm({ deltaT, targetRef, collisionMeshRef }: RightArmProps) {
  const controller = useXRInputSourceState("controller", "right");
  const trackerRef = useRef<Group>(null);

  useControllerCollision(
    collisionMeshRef,
    targetRef,
    controller?.inputSource,
    deltaT
  );

  if (!controller) return null;

  let weaponPos: [number, number, number] = [0, 0, 0];
  if (trackerRef.current) {
    const pos = new Vector3();
    trackerRef.current.getWorldPosition(pos);
    weaponPos = pos.toArray() as [number, number, number];
  }

  return (
    <>
      <XRSpace space={controller.inputSource.gripSpace!}>
        <group ref={trackerRef}>
          <mesh ref={collisionMeshRef} visible={false}>
            <boxGeometry args={[0.1, 0.1, 0.15]} />
          </mesh>
        </group>
      </XRSpace>
      {trackerRef.current && (
        <MeleeWeapon position={weaponPos} deltaT={deltaT} />
      )}
    </>
  );
}
