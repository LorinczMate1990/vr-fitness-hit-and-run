import type { Vector3 } from "three";

export interface BullEnemyState {
  health: number;
  mode: "attack" | "flee";
  fleeDuration: number;
  position: Vector3;
  speed: Vector3;
  // Configuration values stored in state for reducer access
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  fleeDurationStartValue: number;
}

export type BullEnemyAction =
  | { type: "TICK"; deltaT: number; playerPosition: Vector3 }
  | { type: "HIT"; punchSpeed: Vector3 };

export interface BullEnemyConfig {
  health: number;
  position: Vector3;
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  fleeDurationStartValue: number;
}
