import type { Vector3, Mesh } from "three";

export interface Actor {
  getPosition: () => Vector3;
  onHit: (attacker: Actor | null, damage: number, impact: Vector3) => void;
  getCollisionMesh: () => Mesh | null;
}
