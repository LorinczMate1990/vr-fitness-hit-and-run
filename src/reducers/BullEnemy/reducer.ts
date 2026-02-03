import type { BullEnemyState, BullEnemyAction } from "./types";

export function bullEnemyReducer(
  state: BullEnemyState,
  action: BullEnemyAction
): BullEnemyState {
  switch (action.type) {
    case "TICK": {
      const { deltaT, playerPosition } = action;

      if (state.mode === "attack") {
        // Accelerate towards player
        const direction = playerPosition.clone().sub(state.position).normalize();
        const newSpeed = state.speed
          .clone()
          .add(direction.multiplyScalar(state.acceleration * deltaT));

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
        };
      } else {
        // Flee mode
        const newFleeDuration = state.fleeDuration - deltaT;

        if (newFleeDuration <= 0) {
          return {
            ...state,
            mode: "attack",
            fleeDuration: 0,
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
          fleeDuration: newFleeDuration,
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
          fleeDuration: state.fleeDurationStartValue,
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
