import { Vector3 } from "three";
import type { BullEnemyState, BullEnemyConfig } from "./types";

export function createInitialState(config: BullEnemyConfig): BullEnemyState {
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
