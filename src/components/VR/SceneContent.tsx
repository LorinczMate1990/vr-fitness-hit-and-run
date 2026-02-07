import { useRef, useEffect } from "react";
import { Vector3, type Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { XROrigin, useXRInputSourceState } from "@react-three/xr";
import { OrbitControls } from "@react-three/drei";
import LeftArm from "./LeftArm";
import RightArm from "./RightArm";
import MovingBox from "./MovingBox";
import BullEnemy from "./BullEnemy";
import FractalTree from "./FractalTree";
import { useGameStore } from "../../stores/gameStore";
import { GROWTH_RATE, MIN_SCALE } from "../../game/treeLogic";

// Movement cost: 1 second of growth per 10cm (0.1 units) moved
const MOVEMENT_COST_PER_UNIT = GROWTH_RATE * 10;

// Tree movement speed (units per second at full thumbstick deflection)
const TREE_MOVE_SPEED = 0.5;

export default function SceneContent() {
  const movingBoxRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);

  // Spawn initial enemies
  useEffect(() => {
    const { spawnEnemy } = useGameStore.getState();
    const baseConfig = {
      type: "bull" as const,
      health: 100,
      maxSpeed: 8,
      acceleration: 4.5,
      hitSpeedThreshold: 3,
      stateDurationStartValue: 2,
    };

    spawnEnemy({ ...baseConfig, position: new Vector3(0, 1.7, -5) }, "tree");
    spawnEnemy({ ...baseConfig, position: new Vector3(3, 1.7, -4) }, "tree");
    spawnEnemy({ ...baseConfig, position: new Vector3(-3, 1.7, -6) }, "tree");
  }, []);

  // Reactively subscribe to enemy IDs for rendering
  const enemyIds = useGameStore((s) => s.enemyIds);

  // Get left controller for thumbstick input
  const leftController = useXRInputSourceState("controller", "left");

  useFrame((_, delta) => {
    // Handle tree movement via left controller thumbstick
    if (leftController?.inputSource?.gamepad) {
      const gamepad = leftController.inputSource.gamepad;
      // Thumbstick axes: typically axes[2] = X, axes[3] = Y for left controller
      const thumbstickX = gamepad.axes[2] ?? 0;
      const thumbstickY = gamepad.axes[3] ?? 0;

      // Apply deadzone
      const deadzone = 0.15;
      const adjustedX = Math.abs(thumbstickX) > deadzone ? thumbstickX : 0;
      const adjustedY = Math.abs(thumbstickY) > deadzone ? thumbstickY : 0;

      const { tree, moveTree } = useGameStore.getState();

      // Only move if there's input and tree is above minimum scale
      if ((adjustedX !== 0 || adjustedY !== 0) && tree.scale > MIN_SCALE) {
        // Calculate movement on XZ plane
        const moveX = adjustedX * TREE_MOVE_SPEED * delta;
        const moveZ = adjustedY * TREE_MOVE_SPEED * delta; // Thumbstick Y controls Z axis

        // Calculate distance moved and scale cost
        const distanceMoved = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const scaleCost = distanceMoved * MOVEMENT_COST_PER_UNIT;

        moveTree(moveX, moveZ, scaleCost);
      }
    }
  });

  return (
    <>
      <XROrigin />

      <LeftArm targetRef={movingBoxRef} collisionMeshRef={leftArmRef} />
      <RightArm targetRef={movingBoxRef} collisionMeshRef={rightArmRef} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <MovingBox meshRef={movingBoxRef} />

      <FractalTree />

      {enemyIds.map((id) => (
        <BullEnemy key={id} id={id} />
      ))}

      <OrbitControls />
    </>
  );
}
