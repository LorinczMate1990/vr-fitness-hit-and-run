import { Vector3 } from "three";
import { Actor } from "./Actor";
import { useGameStore } from "../stores/gameStore";

const Y_PLANE_THRESHOLD = 0.3; // 30cm tolerance
const TARGET_HIT_DISTANCE = 0.5;
const BULL_DAMAGE = 0.6;

export interface BullEnemyConfig {
  health: number;
  position: Vector3;
  maxSpeed: number;
  acceleration: number;
  hitSpeedThreshold: number;
  stateDurationStartValue: number;
}

export class BullEnemyActor extends Actor {
  targetId: string;
  mode: "attack" | "flee" = "attack";
  stateDuration: number;
  lastTargetHitTime = 0;

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

    this.tickAI(deltaT, targetPosition);

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
    if (this.mode === "flee") return;

    const punchSpeedMagnitude = impact.length();

    if (punchSpeedMagnitude > this.hitSpeedThreshold) {
      const damage = this.speed.clone().sub(impact).length();
      this.speed.copy(impact);
      this.health -= damage;
      this.mode = "flee";
      this.stateDuration = this.stateDurationStartValue;
    } else {
      this.speed.copy(impact);
    }
  }

  // ----- AI state machine -----

  private tickAI(deltaT: number, targetPosition: Vector3): void {
    const newStateDuration = this.stateDuration - deltaT;

    if (newStateDuration <= 0) {
      this.tickRedirect(deltaT, targetPosition);
    } else if (this.mode === "attack") {
      this.tickAttack(deltaT, targetPosition, newStateDuration);
    } else {
      this.tickFlee(deltaT, targetPosition, newStateDuration);
    }
  }

  private tickRedirect(deltaT: number, targetPosition: Vector3): void {
    const currentSpeedMagnitude = this.speed.length();
    const direction = targetPosition.clone().sub(this.position).normalize();

    this.speed.copy(direction.multiplyScalar(currentSpeedMagnitude));

    const yDiff = targetPosition.y - this.position.y;
    if (Math.abs(yDiff) <= Y_PLANE_THRESHOLD) {
      this.speed.y = 0;
    }

    this.position.add(this.speed.clone().multiplyScalar(deltaT));
    this.mode = "attack";
    this.stateDuration = this.stateDurationStartValue;
  }

  private tickAttack(
    deltaT: number,
    targetPosition: Vector3,
    newStateDuration: number
  ): void {
    const direction = targetPosition.clone().sub(this.position);
    direction.y = 0;
    direction.normalize();

    this.speed.add(direction.multiplyScalar(this.acceleration * deltaT));

    const yDiff = targetPosition.y - this.position.y;
    if (Math.abs(yDiff) > Y_PLANE_THRESHOLD) {
      this.speed.y += Math.sign(yDiff) * (this.acceleration * 0.5) * deltaT;
    } else {
      this.speed.y = 0;
    }

    if (this.speed.length() > this.maxSpeed) {
      this.speed.normalize().multiplyScalar(this.maxSpeed);
    }

    this.position.add(this.speed.clone().multiplyScalar(deltaT));
    this.stateDuration = newStateDuration;
  }

  private tickFlee(
    deltaT: number,
    targetPosition: Vector3,
    newStateDuration: number
  ): void {
    const direction = this.position.clone().sub(targetPosition).normalize();
    this.speed.add(direction.multiplyScalar(this.acceleration * deltaT));

    if (this.speed.length() > this.maxSpeed) {
      this.speed.normalize().multiplyScalar(this.maxSpeed);
    }

    this.position.add(this.speed.clone().multiplyScalar(deltaT));
    this.stateDuration = newStateDuration;
  }
}
