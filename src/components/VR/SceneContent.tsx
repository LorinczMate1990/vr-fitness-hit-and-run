import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { XROrigin } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import { Vector3, type Mesh } from "three";
import LeftArm from "./LeftArm";
import RightArm from "./RightArm";
import MovingBox from "./MovingBox";
import BullEnemy from "./BullEnemy";
import FractalTree, { type FractalTreeHandle } from "./FractalTree";
import type { BullEnemyConfig } from "../../reducers/BullEnemy";

// Tree position - the base the player must defend
const TREE_POSITION: [number, number, number] = [0, 0, -2];

const bullEnemyConfig: BullEnemyConfig = {
  health: 100,
  position: new Vector3(0, 1.2, -5),
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
  const treeRef = useRef<FractalTreeHandle>(null);

  // Tree position for the bull to chase
  const treePosition = useRef(new Vector3(...TREE_POSITION));

  useFrame((_, delta) => {
    setDeltaT(delta);
  });

  const handleBullHitTree = () => {
    treeRef.current?.onHit();
  };

  return (
    <>
      <XROrigin />

      <LeftArm deltaT={deltaT} targetRef={movingBoxRef} collisionMeshRef={leftArmRef} />
      <RightArm deltaT={deltaT} targetRef={movingBoxRef} collisionMeshRef={rightArmRef} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <MovingBox deltaT={deltaT} meshRef={movingBoxRef} />

      <FractalTree ref={treeRef} position={TREE_POSITION} />

      <BullEnemy
        config={bullEnemyConfig}
        targetPosition={treePosition.current}
        deltaT={deltaT}
        leftArmRef={leftArmRef}
        rightArmRef={rightArmRef}
        onHitTarget={handleBullHitTree}
      />

      <OrbitControls />
    </>
  );
}
