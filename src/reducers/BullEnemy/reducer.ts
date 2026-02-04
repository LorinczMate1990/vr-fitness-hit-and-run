import type { BullEnemyState, BullEnemyAction } from "./types";

export function bullEnemyReducer(
  state: BullEnemyState,
  action: BullEnemyAction
): BullEnemyState {
  switch (action.type) {
    case "TICK": {
      const { deltaT, playerPosition } = action;
      const newStateDuration = state.stateDuration - deltaT;

      if (state.mode === "attack") {
        const Y_PLANE_THRESHOLD = 0.3; // 30cm tolerance

        // Check if course correction is needed
        if (newStateDuration <= 0) {
          // Preserve speed magnitude, redirect towards player
          const currentSpeedMagnitude = state.speed.length();
          const direction = playerPosition.clone().sub(state.position).normalize();
          const newSpeed = direction.multiplyScalar(currentSpeedMagnitude);

          // Y-plane correction
          const yDiff = playerPosition.y - state.position.y;
          if (Math.abs(yDiff) <= Y_PLANE_THRESHOLD) {
            newSpeed.y = 0;
          }

          const newPosition = state.position
            .clone()
            .add(newSpeed.clone().multiplyScalar(deltaT));

          return {
            ...state,
            speed: newSpeed,
            position: newPosition,
            stateDuration: state.stateDurationStartValue,
          };
        }

        // Normal acceleration towards player (horizontal only)
        const direction = playerPosition.clone().sub(state.position);
        direction.y = 0; // Remove Y component for horizontal pursuit
        direction.normalize();

        const newSpeed = state.speed
          .clone()
          .add(direction.multiplyScalar(state.acceleration * deltaT));

        // Y-plane correction: use half acceleration to return to player's Y plane
        const yDiff = playerPosition.y - state.position.y;
        if (Math.abs(yDiff) > Y_PLANE_THRESHOLD) {
          // Outside threshold: accelerate toward player's Y plane
          const yDirection = Math.sign(yDiff);
          newSpeed.y += yDirection * (state.acceleration * 0.5) * deltaT;
        } else {
          // Within threshold: zero out Y speed
          newSpeed.y = 0;
        }

        // Clamp speed to maxSpeed (only from acceleration, not from hits)
        if (newSpeed.length() > state.maxSpeed) {
          newSpeed.normalize().multiplyScalar(state.maxSpeed);
        }

        const newPosition = state.position
          .clone()
          .add(newSpeed.clone().multiplyScalar(deltaT));

        return {
          ...state,
          speed: newSpeed,
          position: newPosition,
          stateDuration: newStateDuration,
        };
      } else {
        // Flee mode
        if (newStateDuration <= 0) {
          // Switch back to attack mode, redirect towards player
          const currentSpeedMagnitude = state.speed.length();
          const direction = playerPosition.clone().sub(state.position).normalize();
          const newSpeed = direction.multiplyScalar(currentSpeedMagnitude);

          const newPosition = state.position
            .clone()
            .add(newSpeed.clone().multiplyScalar(deltaT));

          return {
            ...state,
            mode: "attack",
            speed: newSpeed,
            position: newPosition,
            stateDuration: state.stateDurationStartValue,
          };
        }

        // Accelerate away from player (inverse of attack)
        const direction = state.position.clone().sub(playerPosition).normalize();
        const newSpeed = state.speed
          .clone()
          .add(direction.multiplyScalar(state.acceleration * deltaT));

        // Clamp speed to maxSpeed
        if (newSpeed.length() > state.maxSpeed) {
          newSpeed.normalize().multiplyScalar(state.maxSpeed);
        }

        const newPosition = state.position
          .clone()
          .add(newSpeed.clone().multiplyScalar(deltaT));

        return {
          ...state,
          speed: newSpeed,
          position: newPosition,
          stateDuration: newStateDuration,
        };
      }
    }

    case "HIT": {
      const { punchSpeed } = action;

      // If fleeing, ignore hit
      if (state.mode === "flee") {
        return state;
      }

      const punchSpeedMagnitude = punchSpeed.length();
      const oldSpeed = state.speed;

      // Always apply punch speed to enemy
      if (punchSpeedMagnitude > state.hitSpeedThreshold) {
        // Strong hit: deal damage and trigger flee
        const speedDifference = oldSpeed.clone().sub(punchSpeed);
        const damage = speedDifference.length();

        return {
          ...state,
          speed: punchSpeed.clone(),
          health: state.health - damage,
          mode: "flee",
          stateDuration: state.stateDurationStartValue,
        };
      } else {
        // Weak hit: just transfer momentum, no damage
        return {
          ...state,
          speed: punchSpeed.clone(),
        };
      }
    }

    default:
      return state;
  }
}
