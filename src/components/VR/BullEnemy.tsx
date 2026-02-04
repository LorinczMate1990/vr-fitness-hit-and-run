import { useReducer, useRef, useEffect } from "react";
import { Vector3, Box3, type Mesh } from "three";
import {
  bullEnemyReducer,
  createInitialState,
  type BullEnemyConfig,
} from "../../reducers/BullEnemy";

interface BullEnemyProps {
  config: BullEnemyConfig;
  targetPosition: Vector3;
  deltaT: number;
  leftArmRef: React.RefObject<Mesh | null>;
  rightArmRef: React.RefObject<Mesh | null>;
  onHitTarget?: () => void;
}

// Distance threshold to count as hitting the target
const TARGET_HIT_DISTANCE = 0.5;

export default function BullEnemy({
  config,
  targetPosition,
  deltaT,
  leftArmRef,
  rightArmRef,
  onHitTarget,
}: BullEnemyProps) {
  const [state, dispatch] = useReducer(
    bullEnemyReducer,
    config,
    createInitialState
  );

  const meshRef = useRef<Mesh>(null);
  const enemyBox = useRef(new Box3());
  const armBox = useRef(new Box3());

  // Track previous arm positions to calculate punch speed
  const prevLeftPos = useRef(new Vector3());
  const prevRightPos = useRef(new Vector3());
  const lastHitTime = useRef(0);
  const lastTargetHitTime = useRef(0);

  // Tick the AI each frame
  useEffect(() => {
    if (deltaT > 0) {
      dispatch({ type: "TICK", deltaT, playerPosition: targetPosition });
    }
  }, [deltaT, targetPosition]);

  // Check collision with target (tree)
  useEffect(() => {
    if (state.mode !== "attack" || deltaT <= 0) return;

    const now = performance.now();
    // Debounce target hits (500ms cooldown)
    if (now - lastTargetHitTime.current < 500) return;

    const distanceToTarget = state.position.distanceTo(targetPosition);
    if (distanceToTarget < TARGET_HIT_DISTANCE) {
      lastTargetHitTime.current = now;
      onHitTarget?.();
    }
  }, [state.position, state.mode, targetPosition, deltaT, onHitTarget]);

  // Check collisions with arms and dispatch HIT events
  useEffect(() => {
    if (!meshRef.current || deltaT <= 0) return;

    const now = performance.now();
    // Debounce hits (200ms cooldown)
    if (now - lastHitTime.current < 200) return;

    enemyBox.current.setFromObject(meshRef.current);

    // Check left arm collision
    if (leftArmRef.current) {
      const currentPos = new Vector3();
      leftArmRef.current.getWorldPosition(currentPos);

      armBox.current.setFromObject(leftArmRef.current);
      if (enemyBox.current.intersectsBox(armBox.current)) {
        // Calculate punch speed from position delta
        const punchSpeed = currentPos.clone().sub(prevLeftPos.current).divideScalar(deltaT);
        dispatch({ type: "HIT", punchSpeed });
        lastHitTime.current = now;
      }

      prevLeftPos.current.copy(currentPos);
    }

    // Check right arm collision
    if (rightArmRef.current) {
      const currentPos = new Vector3();
      rightArmRef.current.getWorldPosition(currentPos);

      armBox.current.setFromObject(rightArmRef.current);
      if (enemyBox.current.intersectsBox(armBox.current)) {
        // Calculate punch speed from position delta
        const punchSpeed = currentPos.clone().sub(prevRightPos.current).divideScalar(deltaT);
        dispatch({ type: "HIT", punchSpeed });
        lastHitTime.current = now;
      }

      prevRightPos.current.copy(currentPos);
    }
  }, [deltaT, leftArmRef, rightArmRef]);

  // Color based on state: red when attacking, yellow when fleeing
  const color = state.mode === "attack" ? "#ff0000" : "#ffcc00";

  return (
    <mesh ref={meshRef} position={state.position}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
