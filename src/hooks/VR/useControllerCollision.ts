import { useRef } from "react";
import { Box3, type Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export function useControllerCollision(
  controllerMeshRef: React.RefObject<Mesh | null>,
  targetRef: React.RefObject<Mesh | null>,
  inputSource: XRInputSource | undefined
) {
  const lastPulse = useRef(0);
  const boxA = useRef(new Box3());
  const boxB = useRef(new Box3());

  useFrame(() => {
    if (!controllerMeshRef.current || !targetRef.current || !inputSource)
      return;

    boxA.current.setFromObject(controllerMeshRef.current);
    boxB.current.setFromObject(targetRef.current);

    if (boxA.current.intersectsBox(boxB.current)) {
      const now = performance.now();
      if (now - lastPulse.current > 200) {
        lastPulse.current = now;
        const gamepad = inputSource.gamepad;
        if (gamepad?.hapticActuators?.[0]) {
          (gamepad.hapticActuators[0] as any).pulse(0.8, 100);
        }
      }
    }
  });
}
