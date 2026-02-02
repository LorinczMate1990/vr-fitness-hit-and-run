import { useRef } from "react";
import { useThree } from "@react-three/fiber";
import { XRSpace, useXRInputSourceState } from "@react-three/xr";
import { Vector3, Quaternion, BufferGeometry, type Mesh, type Group } from "three";
import { useControllerCollision } from "../../hooks/VR/useControllerCollision";
import GenericRobotArm from "./GenericRobotArm";

interface RightArmProps {
  deltaT: number;
  targetRef: React.RefObject<Mesh | null>;
}

// Right shoulder offset from the headset in head-local space
const SHOULDER_OFFSET = new Vector3(0.15, -0.35, -0.05);

// Debug line: 1m along local +Y (up)
const debugLineGeometry = new BufferGeometry().setFromPoints([
  new Vector3(0, 0, 0),
  new Vector3(0, 1, 0),
]);

export default function RightArm({ deltaT, targetRef }: RightArmProps) {
  const controller = useXRInputSourceState("controller", "right");
  const trackerRef = useRef<Group>(null);
  const collisionMeshRef = useRef<Mesh>(null);
  const { camera } = useThree();

  useControllerCollision(
    collisionMeshRef,
    targetRef,
    controller?.inputSource,
    deltaT
  );

  if (!controller) return null;

  let armElement = null;
  if (trackerRef.current) {
    const controllerPos = new Vector3();
    const controllerQuat = new Quaternion();
    trackerRef.current.getWorldPosition(controllerPos);
    trackerRef.current.getWorldQuaternion(controllerQuat);

    // Controller's up direction in world space
    const controllerUp = new Vector3(0, 1, 0).applyQuaternion(controllerQuat);

    // Shoulder position derived from headset
    const shoulderWorld = SHOULDER_OFFSET.clone()
      .applyQuaternion(camera.quaternion)
      .add(camera.position);

    armElement = (
      <GenericRobotArm
        a={0.05}
        b={0.25}
        r={0.1}
        l={0.05}
        base={shoulderWorld.toArray() as [number, number, number]}
        end={controllerPos.toArray() as [number, number, number]}
        direction={controllerUp.toArray() as [number, number, number]}
      />
    );
  }

  return (
    <>
      <XRSpace space={controller.inputSource.gripSpace!}>
        <group ref={trackerRef}>
          {/* Invisible mesh for collision detection */}
          <mesh ref={collisionMeshRef} visible={false}>
            <boxGeometry args={[0.1, 0.1, 0.15]} />
          </mesh>
          {/* Debug: 1m red line along controller up */}
          <line geometry={debugLineGeometry}>
            <lineBasicMaterial color="red" />
          </line>
        </group>
      </XRSpace>
      {armElement}
    </>
  );
}
