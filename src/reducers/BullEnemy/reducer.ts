import type { Vector3 } from "three";
import type { BullEnemyState, BullEnemyAction } from "./types";

const Y_PLANE_THRESHOLD = 0.3; // 30cm tolerance

function tick(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3
): BullEnemyState {
  const newStateDuration = state.stateDuration - deltaT;

  if (newStateDuration <= 0) {
    return tickRedirect(state, deltaT, targetPosition);
  } else if (state.mode === "attack") {
    return tickAttack(state, deltaT, targetPosition, newStateDuration);
  } else {
    return tickFlee(state, deltaT, targetPosition, newStateDuration);
  }
}

function tickRedirect(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3
): BullEnemyState {
  const currentSpeedMagnitude = state.speed.length();
  const direction = targetPosition.clone().sub(state.position).normalize();
  const newSpeed = direction.multiplyScalar(currentSpeedMagnitude);

  // Keep it near to the Y-plane
  const yDiff = targetPosition.y - state.position.y;
  if (Math.abs(yDiff) <= Y_PLANE_THRESHOLD) {
    newSpeed.y = 0;
  }

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

function tickAttack(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3,
  newStateDuration: number
): BullEnemyState {
  // Acceleration towards target (horizontal only)
  const direction = targetPosition.clone().sub(state.position);
  direction.y = 0;
  direction.normalize();

  const newSpeed = state.speed
    .clone()
    .add(direction.multiplyScalar(state.acceleration * deltaT));

  // Y-plane correction: use half acceleration to return to target's Y plane
  const yDiff = targetPosition.y - state.position.y;
  if (Math.abs(yDiff) > Y_PLANE_THRESHOLD) {
    const yDirection = Math.sign(yDiff);
    newSpeed.y += yDirection * (state.acceleration * 0.5) * deltaT;
  } else {
    newSpeed.y = 0;
  }

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

function tickFlee(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3,
  newStateDuration: number
): BullEnemyState {
  // Accelerate away from target
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
