import { useReducer, useRef, forwardRef, useImperativeHandle } from "react";
import { Vector3, type Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import {
  bullEnemyReducer,
  createInitialState,
  type BullEnemyConfig,
} from "../../reducers/BullEnemy";
import type { Actor } from "../../types/Actor";

export interface BullEnemyHandle extends Actor {
  getMeshRef: () => React.RefObject<Mesh | null>;
}

interface BullEnemyProps {
  config: BullEnemyConfig;
  target: Actor;
}

// Distance threshold to count as hitting the target
const TARGET_HIT_DISTANCE = 0.5;
// Damage dealt when bull hits tree
const BULL_DAMAGE = 0.6;

const BullEnemy = forwardRef<BullEnemyHandle, BullEnemyProps>(
  ({ config, target }, ref) => {
    const [state, dispatch] = useReducer(
      bullEnemyReducer,
      config,
      createInitialState
    );

    const meshRef = useRef<Mesh>(null);
    const lastTargetHitTime = useRef(0);
    const { camera } = useThree();

    useImperativeHandle(
      ref,
      () => ({
        getPosition: () => state.position.clone(),
        onHit: (_attacker: Actor | null, damage: number) => {
          // Convert damage to a punch speed vector (simplified)
          const punchSpeed = new Vector3(0, 0, -damage);
          dispatch({ type: "HIT", punchSpeed });
        },
        getMeshRef: () => meshRef,
      }),
      [state.position]
    );

    useFrame((_, deltaT) => {
      // Target position: tree's XZ but player's head Y
      const targetPosition = target.getPosition();
      targetPosition.y = camera.position.y;

      // Tick the AI
      dispatch({ type: "TICK", deltaT, targetPosition });

      // Check collision with target
      if (state.mode === "attack") {
        const now = performance.now();
        if (now - lastTargetHitTime.current >= 500) {
          const distanceToTarget = state.position.distanceTo(targetPosition);
          if (distanceToTarget < TARGET_HIT_DISTANCE) {
            lastTargetHitTime.current = now;
            target.onHit(null, BULL_DAMAGE);
          }
        }
      }
    });

    // Color based on state: red when attacking, yellow when fleeing
    const color = state.mode === "attack" ? "#ff0000" : "#ffcc00";

    return (
      <mesh ref={meshRef} position={state.position}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
);

BullEnemy.displayName = "BullEnemy";

export default BullEnemy;
