import { Vector3 } from "three";
import { Actor } from "./Actor";

export const GROWTH_RATE = 0.02;
export const HIT_PENALTY = GROWTH_RATE * 30;
export const MIN_SCALE = 0.3;
export const MAX_SCALE = 2.0;

export class TreeActor extends Actor {
  scale = 1.0;

  constructor(id: string, position: [number, number, number]) {
    super(id, new Vector3(...position), Infinity);
  }

  tick(deltaT: number): void {
    this.scale = Math.min(MAX_SCALE, this.scale + GROWTH_RATE * deltaT);
  }

  onHit(_attackerId: string, damage: number, _impact: Vector3): void {
    const penalty = damage > 0 ? damage : HIT_PENALTY;
    this.scale = Math.max(MIN_SCALE, this.scale - penalty);
  }

  moveTree(dx: number, dz: number, scaleCost: number): boolean {
    if (this.scale - scaleCost < MIN_SCALE) return false;
    this.position.x += dx;
    this.position.z += dz;
    this.scale -= scaleCost;
    return true;
  }
}
