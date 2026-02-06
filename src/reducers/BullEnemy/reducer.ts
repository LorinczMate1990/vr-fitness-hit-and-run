import type { Vector3 } from "three";
import type { BullEnemyState, BullEnemyAction } from "./types";

function tick(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3
): BullEnemyState {
  const newStateDuration = state.stateDuration - deltaT;

  if (state.mode === "attack") {
    const Y_PLANE_THRESHOLD = 0.3; // 30cm tolerance

    // Check if course correction is needed
    if (newStateDuration <= 0) {
      // Preserve speed magnitude, redirect towards target
      const currentSpeedMagnitude = state.speed.length();
      const direction = targetPosition.clone().sub(state.position).normalize();
      const newSpeed = direction.multiplyScalar(currentSpeedMagnitude);

      // Y-plane correction
      const yDiff = targetPosition.y - state.position.y;
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

    // Normal acceleration towards target (horizontal only)
    const direction = targetPosition.clone().sub(state.position);
    direction.y = 0; // Remove Y component for horizontal pursuit
    direction.normalize();

    const newSpeed = state.speed
      .clone()
      .add(direction.multiplyScalar(state.acceleration * deltaT));

    // Y-plane correction: use half acceleration to return to target's Y plane
    const yDiff = targetPosition.y - state.position.y;
    if (Math.abs(yDiff) > Y_PLANE_THRESHOLD) {
      // Outside threshold: accelerate toward target's Y plane
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
      // Switch back to attack mode, redirect towards target
      const currentSpeedMagnitude = state.speed.length();
      const direction = targetPosition.clone().sub(state.position).normalize();
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

    // Accelerate away from target (inverse of attack)
    const direction = state.position.clone().sub(targetPosition).normalize();
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

function hit(state: BullEnemyState, punchSpeed: Vector3): BullEnemyState {
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

export function bullEnemyReducer(
  state: BullEnemyState,
  action: BullEnemyAction
): BullEnemyState {
  switch (action.type) {
    case "TICK":
      return tick(state, action.deltaT, action.targetPosition);
    case "HIT":
      return hit(state, action.punchSpeed);
    default:
      return state;
  }
}
