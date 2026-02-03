import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { XROrigin } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import { Vector3, type Mesh } from "three";
import LeftArm from "./LeftArm";
import RightArm from "./RightArm";
import MovingBox from "./MovingBox";
import BullEnemy from "./BullEnemy";
import type { BullEnemyConfig } from "../../reducers/BullEnemy";

const bullEnemyConfig: BullEnemyConfig = {
  health: 100,
  position: new Vector3(0, 1.2, -3),
  maxSpeed: 8,
  acceleration: 4.5,
  hitSpeedThreshold: 3,
  stateDurationStartValue: 2,
};

export default function SceneContent() {
  const [deltaT, setDeltaT] = useState(0);
  const movingBoxRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);

  // Use camera position as player position
  const { camera } = useThree();
  const playerPosition = useRef(new Vector3());

  useFrame((_, delta) => {
    setDeltaT(delta);
    playerPosition.current.copy(camera.position);
  });

  return (
    <>
      <XROrigin />

      <LeftArm deltaT={deltaT} targetRef={movingBoxRef} collisionMeshRef={leftArmRef} />
      <RightArm deltaT={deltaT} targetRef={movingBoxRef} collisionMeshRef={rightArmRef} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <MovingBox deltaT={deltaT} meshRef={movingBoxRef} />

      <BullEnemy
        config={bullEnemyConfig}
        playerPosition={playerPosition.current}
        deltaT={deltaT}
        leftArmRef={leftArmRef}
        rightArmRef={rightArmRef}
      />

      <mesh position={[1.2, 1, -3]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#f72585" />
      </mesh>

      <OrbitControls />
    </>
  );
}
