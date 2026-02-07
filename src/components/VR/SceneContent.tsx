import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { XROrigin, useXRInputSourceState } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import { Vector3, type Mesh } from "three";
import LeftArm from "./LeftArm";
import RightArm from "./RightArm";
import MovingBox from "./MovingBox";
import BullEnemy, { type BullEnemyHandle } from "./BullEnemy";
import FractalTree, { type FractalTreeHandle, MIN_SCALE, GROWTH_RATE } from "./FractalTree";
import type { BullEnemyConfig } from "../../reducers/BullEnemy";

// Tree initial position - the base the player must defend
const TREE_INITIAL_POSITION: [number, number, number] = [0, 0, -2];

// Movement cost: 1 second of growth per 10cm (0.1 units) moved
const MOVEMENT_COST_PER_UNIT = GROWTH_RATE * 10; // GROWTH_RATE per 0.1 units = GROWTH_RATE * 10 per unit

// Tree movement speed (units per second at full thumbstick deflection)
const TREE_MOVE_SPEED = 0.5;

const bullEnemyConfig: BullEnemyConfig = {
  health: 100,
  position: new Vector3(0, 1.7, -5),
  maxSpeed: 8,
  acceleration: 4.5,
  hitSpeedThreshold: 3,
  stateDurationStartValue: 2,
};

export default function SceneContent() {
  const [deltaT, setDeltaT] = useState(0);
  const [treePosition, setTreePosition] = useState<[number, number, number]>(TREE_INITIAL_POSITION);
  const movingBoxRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const treeRef = useRef<FractalTreeHandle>(null);
  const bullEnemyRef = useRef<BullEnemyHandle>(null);

  // Get left controller for thumbstick input
  const leftController = useXRInputSourceState("controller", "left");

  useFrame((_, delta) => {
    setDeltaT(delta);

    // Handle tree movement via left controller thumbstick
    if (leftController?.inputSource?.gamepad && treeRef.current) {
      const gamepad = leftController.inputSource.gamepad;
      // Thumbstick axes: typically axes[2] = X, axes[3] = Y for left controller
      const thumbstickX = gamepad.axes[2] ?? 0;
      const thumbstickY = gamepad.axes[3] ?? 0;

      // Apply deadzone
      const deadzone = 0.15;
      const adjustedX = Math.abs(thumbstickX) > deadzone ? thumbstickX : 0;
      const adjustedY = Math.abs(thumbstickY) > deadzone ? thumbstickY : 0;

      // Only move if there's input and tree is above minimum scale
      if ((adjustedX !== 0 || adjustedY !== 0) && treeRef.current.getScale() > MIN_SCALE) {
        // Calculate movement on XZ plane
        const moveX = adjustedX * TREE_MOVE_SPEED * delta;
        const moveZ = adjustedY * TREE_MOVE_SPEED * delta; // Thumbstick Y controls Z axis

        // Calculate distance moved
        const distanceMoved = Math.sqrt(moveX * moveX + moveZ * moveZ);

        // Calculate scale cost for this movement
        const scaleCost = distanceMoved * MOVEMENT_COST_PER_UNIT;

        // Check if we have enough scale to move
        const currentScale = treeRef.current.getScale();
        const scaleAfterMove = currentScale - scaleCost;

        if (scaleAfterMove >= MIN_SCALE) {
          // Apply the movement
          setTreePosition((prev) => [
            prev[0] + moveX,
            prev[1], // Y stays constant
            prev[2] + moveZ,
          ]);

          // Reduce scale based on distance moved
          treeRef.current.reduceScale(scaleCost);
        }
      }
    }
  });

  return (
    <>
      <XROrigin />

      <LeftArm deltaT={deltaT} targetRef={movingBoxRef} collisionMeshRef={leftArmRef} targets={[bullEnemyRef]} />
      <RightArm deltaT={deltaT} targetRef={movingBoxRef} collisionMeshRef={rightArmRef} targets={[bullEnemyRef]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <MovingBox deltaT={deltaT} meshRef={movingBoxRef} />

      <FractalTree ref={treeRef} position={treePosition} />

      <BullEnemy
        ref={bullEnemyRef}
        config={bullEnemyConfig}
        target={treeRef}
      />

      <OrbitControls />
    </>
  );
}
