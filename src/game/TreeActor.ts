import { Vector3 } from "three";
import { Actor } from "./Actor";
import { grow, hitTree, MIN_SCALE } from "./treeLogic";

export class TreeActor extends Actor {
  scale = 1.0;

  constructor(id: string, position: [number, number, number]) {
    super(id, new Vector3(...position), Infinity);
  }

  tick(deltaT: number): void {
    grow(this, deltaT);
  }

  onHit(_attackerId: string, damage: number, _impact: Vector3): void {
    hitTree(this, damage);
  }

  moveTree(dx: number, dz: number, scaleCost: number): boolean {
    if (this.scale - scaleCost < MIN_SCALE) return false;
    this.position.x += dx;
    this.position.z += dz;
    this.scale -= scaleCost;
    return true;
  }
}
