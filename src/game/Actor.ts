import { Vector3, type Mesh } from "three";

export abstract class Actor {
  readonly id: string;
  position: Vector3;
  speed: Vector3;
  health: number;
  mesh: Mesh | null = null;

  constructor(id: string, position: Vector3, health: number) {
    this.id = id;
    this.position = position.clone();
    this.speed = new Vector3();
    this.health = health;
  }

  abstract tick(deltaT: number): void;
  abstract onHit(attackerId: string, damage: number, impact: Vector3): void;
}
