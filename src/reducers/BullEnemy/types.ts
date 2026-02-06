import type { Vector3 } from "three";

export interface BullEnemyState {
  health: number;
  mode: "attack" | "flee";
  stateDuration: number;
  position: Vector3;
  speed: Vector3;
  // Configuration values stored in state for reducer access
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  stateDurationStartValue: number;
}

export type BullEnemyAction =
  | { type: "TICK"; deltaT: number; targetPosition: Vector3 }
  | { type: "HIT"; punchSpeed: Vector3 };

export interface BullEnemyConfig {
  health: number;
  position: Vector3;
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  stateDurationStartValue: number;
}
