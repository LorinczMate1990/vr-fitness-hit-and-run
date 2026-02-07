import { Vector3 } from "three";

const Y_PLANE_THRESHOLD = 0.3; // 30cm tolerance

export interface BullEnemyConfig {
  health: number;
  position: Vector3;
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  stateDurationStartValue: number;
}

export interface BullEnemyState {
  health: number;
  mode: "attack" | "flee";
  stateDuration: number;
  position: Vector3;
  speed: Vector3;
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  stateDurationStartValue: number;
}

export function createBullEnemyState(config: BullEnemyConfig): BullEnemyState {
  return {
    health: config.health,
    mode: "attack",
    stateDuration: config.stateDurationStartValue,
    position: config.position.clone(),
    speed: new Vector3(0, 0, 0),
    maxSpeed: config.maxSpeed,
    acceleration: config.acceleration,
    hitSpeedThreshold: config.hitSpeedThreshold,
    stateDurationStartValue: config.stateDurationStartValue,
  };
}

/** Run one frame of AI logic. Mutates state in place. */
export function tick(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3
): void {
  const newStateDuration = state.stateDuration - deltaT;

  if (newStateDuration <= 0) {
    tickRedirect(state, deltaT, targetPosition);
  } else if (state.mode === "attack") {
    tickAttack(state, deltaT, targetPosition, newStateDuration);
  } else {
    tickFlee(state, deltaT, targetPosition, newStateDuration);
  }
}

function tickRedirect(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3
): void {
  const currentSpeedMagnitude = state.speed.length();
  const direction = targetPosition.clone().sub(state.position).normalize();

  state.speed.copy(direction.multiplyScalar(currentSpeedMagnitude));

  // Keep it near to the Y-plane
  const yDiff = targetPosition.y - state.position.y;
  if (Math.abs(yDiff) <= Y_PLANE_THRESHOLD) {
    state.speed.y = 0;
  }

  state.position.add(state.speed.clone().multiplyScalar(deltaT));
  state.mode = "attack";
  state.stateDuration = state.stateDurationStartValue;
}

function tickAttack(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3,
  newStateDuration: number
): void {
  // Acceleration towards target (horizontal only)
  const direction = targetPosition.clone().sub(state.position);
  direction.y = 0;
  direction.normalize();

  state.speed.add(direction.multiplyScalar(state.acceleration * deltaT));

  // Y-plane correction: use half acceleration to return to target's Y plane
  const yDiff = targetPosition.y - state.position.y;
  if (Math.abs(yDiff) > Y_PLANE_THRESHOLD) {
    state.speed.y += Math.sign(yDiff) * (state.acceleration * 0.5) * deltaT;
  } else {
    state.speed.y = 0;
  }

  // Clamp speed to maxSpeed
  if (state.speed.length() > state.maxSpeed) {
    state.speed.normalize().multiplyScalar(state.maxSpeed);
  }

  state.position.add(state.speed.clone().multiplyScalar(deltaT));
  state.stateDuration = newStateDuration;
}

function tickFlee(
  state: BullEnemyState,
  deltaT: number,
  targetPosition: Vector3,
  newStateDuration: number
): void {
  // Accelerate away from target
  const direction = state.position.clone().sub(targetPosition).normalize();
  state.speed.add(direction.multiplyScalar(state.acceleration * deltaT));

  // Clamp speed to maxSpeed
  if (state.speed.length() > state.maxSpeed) {
    state.speed.normalize().multiplyScalar(state.maxSpeed);
  }

  state.position.add(state.speed.clone().multiplyScalar(deltaT));
  state.stateDuration = newStateDuration;
}

/** Process a hit on the bull enemy. Mutates state in place. */
export function hit(state: BullEnemyState, punchSpeed: Vector3): void {
  // If fleeing, ignore hit
  if (state.mode === "flee") return;

  const punchSpeedMagnitude = punchSpeed.length();

  if (punchSpeedMagnitude > state.hitSpeedThreshold) {
    // Strong hit: deal damage and trigger flee
    const damage = state.speed.clone().sub(punchSpeed).length();
    state.speed.copy(punchSpeed);
    state.health -= damage;
    state.mode = "flee";
    state.stateDuration = state.stateDurationStartValue;
  } else {
    // Weak hit: just transfer momentum, no damage
    state.speed.copy(punchSpeed);
  }
}
