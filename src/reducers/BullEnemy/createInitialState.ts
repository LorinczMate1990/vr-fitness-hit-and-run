import { Vector3 } from "three";
import type { BullEnemyState, BullEnemyConfig } from "./types";

export function createInitialState(config: BullEnemyConfig): BullEnemyState {
  return {
    health: config.health,
    mode: "attack",
    fleeDuration: 0,
    position: config.position.clone(),
    speed: new Vector3(0, 0, 0),
    maxSpeed: config.maxSpeed,
    acceleration: config.acceleration,
    hitSpeedThreshold: config.hitSpeedThreshold,
    fleeDurationStartValue: config.fleeDurationStartValue,
  };
}
