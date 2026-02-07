import { create } from "zustand";
import { Vector3, Box3, type Mesh } from "three";
import { Actor } from "../game/Actor";

// ----- Weapon types -----

const WEAPON_HIT_COOLDOWN = 200; // ms
const WEAPON_MAX_SPEED = 10; // m/s

export interface WeaponInstance {
  id: string;
  mesh: Mesh | null;
  prevPosition: Vector3;
  lastHitTime: number;
  speedNormalized: number;
}

// ----- Store -----

interface GameStore {
  // All game actors (enemies, tree, etc.)
  actors: Map<string, Actor>;
  enemyIds: string[];

  addActor: (actor: Actor) => void;
  spawnEnemy: (enemy: Actor) => void;
  removeActor: (id: string) => void;

  // Weapons (damage dealers, not actors)
  weapons: Map<string, WeaponInstance>;

  registerWeapon: (id: string) => void;
  unregisterWeapon: (id: string) => void;
  setWeaponMesh: (id: string, mesh: Mesh | null) => void;
  tickWeapon: (id: string, delta: number) => void;

  // Universal hit — delegates to target.onHit()
  hit: (
    attackerId: string,
    targetId: string,
    damage: number,
    impact: Vector3
  ) => void;

  // Camera Y position (set by component each frame, read by actors)
  cameraY: number;
}

// Scratch objects to avoid per-frame allocations
const _weaponBox = new Box3();
const _targetBox = new Box3();
const _currPos = new Vector3();

export const useGameStore = create<GameStore>((set, get) => ({
  actors: new Map(),
  enemyIds: [],

  addActor: (actor) => {
    get().actors.set(actor.id, actor);
  },

  spawnEnemy: (enemy) => {
    const { actors } = get();
    actors.set(enemy.id, enemy);
    set({ enemyIds: [...get().enemyIds, enemy.id] });
  },

  removeActor: (id) => {
    get().actors.delete(id);
    set({ enemyIds: get().enemyIds.filter((eid) => eid !== id) });
  },

  // ----- Weapons -----

  weapons: new Map(),

  registerWeapon: (id) => {
    get().weapons.set(id, {
      id,
      mesh: null,
      prevPosition: new Vector3(),
      lastHitTime: 0,
      speedNormalized: 0,
    });
  },

  unregisterWeapon: (id) => {
    get().weapons.delete(id);
  },

  setWeaponMesh: (id, mesh) => {
    const weapon = get().weapons.get(id);
    if (weapon) weapon.mesh = mesh;
  },

  tickWeapon: (id, delta) => {
    const state = get();
    const weapon = state.weapons.get(id);
    if (!weapon?.mesh || delta <= 0) return;

    weapon.mesh.getWorldPosition(_currPos);
    const speed = _currPos.distanceTo(weapon.prevPosition) / delta;
    weapon.speedNormalized = Math.min(speed / WEAPON_MAX_SPEED, 1);

    // Check collision with all actors that have a mesh
    const now = performance.now();
    if (now - weapon.lastHitTime >= WEAPON_HIT_COOLDOWN) {
      _weaponBox.setFromObject(weapon.mesh);

      for (const actor of state.actors.values()) {
        if (!actor.mesh) continue;

        _targetBox.setFromObject(actor.mesh);
        if (_weaponBox.intersectsBox(_targetBox)) {
          const impact = _currPos
            .clone()
            .sub(weapon.prevPosition)
            .divideScalar(delta);
          state.hit(weapon.id, actor.id, impact.length(), impact);
          weapon.lastHitTime = now;
          break;
        }
      }
    }

    weapon.prevPosition.copy(_currPos);
  },

  // ----- Universal hit -----

  hit: (_attackerId, targetId, damage, impact) => {
    const target = get().actors.get(targetId);
    target?.onHit(_attackerId, damage, impact);
  },

  cameraY: 1.7,
}));
