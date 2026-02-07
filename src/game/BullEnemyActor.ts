import { Vector3 } from "three";
import { Actor } from "./Actor";
import { tick as tickAI, hit as hitAI, type BullEnemyConfig } from "./bullEnemyLogic";
import { useGameStore } from "../stores/gameStore";

// Distance threshold to count as hitting the target
const TARGET_HIT_DISTANCE = 0.5;
// Damage dealt when bull hits its target
const BULL_DAMAGE = 0.6;

export type { BullEnemyConfig };

export class BullEnemyActor extends Actor {
  targetId: string;
  mode: "attack" | "flee" = "attack";
  stateDuration: number;
  lastTargetHitTime = 0;

  // Config
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  stateDurationStartValue: number;

  constructor(id: string, config: BullEnemyConfig, targetId: string) {
    super(id, config.position, config.health);
    this.targetId = targetId;
    this.stateDuration = config.stateDurationStartValue;
    this.maxSpeed = config.maxSpeed;
    this.acceleration = config.acceleration;
    this.hitSpeedThreshold = config.hitSpeedThreshold;
    this.stateDurationStartValue = config.stateDurationStartValue;
  }

  tick(deltaT: number): void {
    const store = useGameStore.getState();
    const target = store.actors.get(this.targetId);
    if (!target) return;

    const targetPosition = target.position.clone();
    targetPosition.y = store.cameraY;

    // AI tick (pure logic, operates on 'this' via structural typing)
    tickAI(this, deltaT, targetPosition);

    // Check if reached target
    if (this.mode === "attack") {
      const now = performance.now();
      if (now - this.lastTargetHitTime >= 500) {
        if (this.position.distanceTo(targetPosition) < TARGET_HIT_DISTANCE) {
          this.lastTargetHitTime = now;
          store.hit(this.id, this.targetId, BULL_DAMAGE, this.speed.clone());
        }
      }
    }
  }

  onHit(_attackerId: string, _damage: number, impact: Vector3): void {
    hitAI(this, impact);
  }
}
