import { create } from "zustand";
import { Vector3, Box3, type Mesh } from "three";
import {
  type BullEnemyState,
  type BullEnemyConfig,
  createBullEnemyState,
  tick as tickBullEnemyAI,
  hit as hitBullEnemyAI,
} from "../game/bullEnemyLogic";
import {
  type TreeState,
  createTreeState,
  grow as growTree,
  hitTree as hitTreeLogic,
  moveTree as moveTreeLogic,
  MIN_SCALE,
} from "../game/treeLogic";

// ----- Constants -----

const TARGET_HIT_DISTANCE = 0.5;
const BULL_DAMAGE = 0.6;
const WEAPON_HIT_COOLDOWN = 200; // ms
const WEAPON_MAX_SPEED = 10; // m/s, for normalizing shader speed

// ----- Entity types -----

interface BaseEnemy {
  id: string;
  type: string;
  targetId: string;
  mesh: Mesh | null;
  lastTargetHitTime: number;
  position: Vector3;
  speed: Vector3;
  health: number;
  mode: "attack" | "flee";
}

export interface BullEnemyInstance extends BaseEnemy, BullEnemyState {
  type: "bull";
}

// Extend with more enemy types: | GoblinInstance | ...
export type Enemy = BullEnemyInstance;

export type EnemyConfig = { type: "bull" } & BullEnemyConfig;

export interface WeaponInstance {
  id: string;
  mesh: Mesh | null;
  prevPosition: Vector3;
  lastHitTime: number;
  speedNormalized: number;
}

// ----- Store -----

interface GameStore {
  // Enemies (generic collection)
  enemies: Map<string, Enemy>;
  enemyIds: string[];

  spawnEnemy: (config: EnemyConfig, targetId: string) => string;
  destroyEnemy: (id: string) => void;
  tickEnemy: (id: string, deltaT: number, cameraY: number) => void;
  setEnemyMesh: (id: string, mesh: Mesh | null) => void;

  // Weapons
  weapons: Map<string, WeaponInstance>;

  registerWeapon: (id: string) => void;
  unregisterWeapon: (id: string) => void;
  setWeaponMesh: (id: string, mesh: Mesh | null) => void;
  tickWeapon: (id: string, delta: number) => void;

  // Universal hit: attacker hits target
  hit: (
    attackerId: string,
    targetId: string,
    damage: number,
    impact: Vector3
  ) => void;

  // Tree
  tree: TreeState & { mesh: Mesh | null };

  tickTree: (deltaT: number) => void;
  moveTree: (dx: number, dz: number, scaleCost: number) => boolean;
  setTreeMesh: (mesh: Mesh | null) => void;
}

let nextEnemyId = 0;

const TREE_INITIAL_POSITION: [number, number, number] = [0, 0, -2];

// Scratch objects to avoid per-frame allocations
const _weaponBox = new Box3();
const _targetBox = new Box3();
const _currPos = new Vector3();

/** Resolve a targetId to a world position. */
function getTargetPosition(
  state: GameStore,
  targetId: string,
  cameraY: number
): Vector3 | null {
  if (targetId === "tree") {
    return new Vector3(
      state.tree.position[0],
      cameraY,
      state.tree.position[2]
    );
  }
  // Future: resolve other target types
  return null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  enemies: new Map(),
  enemyIds: [],

  spawnEnemy: (config, targetId) => {
    const id = `enemy-${nextEnemyId++}`;
    let instance: Enemy;

    switch (config.type) {
      case "bull":
        instance = {
          ...createBullEnemyState(config),
          id,
          type: "bull",
          targetId,
          mesh: null,
          lastTargetHitTime: 0,
        };
        break;
    }

    const { enemies } = get();
    enemies.set(id, instance);
    set({ enemyIds: [...enemies.keys()] });
    return id;
  },

  destroyEnemy: (id) => {
    const { enemies } = get();
    enemies.delete(id);
    set({ enemyIds: [...enemies.keys()] });
  },

  tickEnemy: (id, deltaT, cameraY) => {
    const state = get();
    const enemy = state.enemies.get(id);
    if (!enemy) return;

    const targetPosition = getTargetPosition(state, enemy.targetId, cameraY);
    if (!targetPosition) return;

    // Dispatch AI tick by enemy type
    switch (enemy.type) {
      case "bull":
        tickBullEnemyAI(enemy, deltaT, targetPosition);
        break;
    }

    // Check if enemy reached its target (melee attack)
    if (enemy.mode === "attack") {
      const now = performance.now();
      if (now - enemy.lastTargetHitTime >= 500) {
        const dist = enemy.position.distanceTo(targetPosition);
        if (dist < TARGET_HIT_DISTANCE) {
          enemy.lastTargetHitTime = now;
          state.hit(enemy.id, enemy.targetId, BULL_DAMAGE, enemy.speed.clone());
        }
      }
    }
  },

  setEnemyMesh: (id, mesh) => {
    const enemy = get().enemies.get(id);
    if (enemy) enemy.mesh = mesh;
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

    // Calculate world position and speed
    weapon.mesh.getWorldPosition(_currPos);
    const speed = _currPos.distanceTo(weapon.prevPosition) / delta;
    weapon.speedNormalized = Math.min(speed / WEAPON_MAX_SPEED, 1);

    // Check collision with all enemies
    const now = performance.now();
    if (now - weapon.lastHitTime >= WEAPON_HIT_COOLDOWN) {
      _weaponBox.setFromObject(weapon.mesh);

      for (const enemy of state.enemies.values()) {
        if (!enemy.mesh) continue;

        _targetBox.setFromObject(enemy.mesh);
        if (_weaponBox.intersectsBox(_targetBox)) {
          const impact = _currPos
            .clone()
            .sub(weapon.prevPosition)
            .divideScalar(delta);
          state.hit(weapon.id, enemy.id, impact.length(), impact);
          weapon.lastHitTime = now;
          break;
        }
      }
    }

    weapon.prevPosition.copy(_currPos);
  },

  // ----- Universal hit -----

  hit: (attackerId, targetId, damage, impact) => {
    const state = get();

    // Target is an enemy?
    const enemy = state.enemies.get(targetId);
    if (enemy) {
      switch (enemy.type) {
        case "bull":
          hitBullEnemyAI(enemy, impact);
          break;
      }
      return;
    }

    // Target is the tree?
    if (targetId === "tree") {
      hitTreeLogic(state.tree, damage);
      return;
    }

    // Future: other target types
    void attackerId; // available for scoring, effects, etc.
  },

  // ----- Tree -----

  tree: {
    ...createTreeState(TREE_INITIAL_POSITION),
    mesh: null,
  },

  tickTree: (deltaT) => {
    growTree(get().tree, deltaT);
  },

  moveTree: (dx, dz, scaleCost) => {
    const { tree } = get();
    if (tree.scale - scaleCost < MIN_SCALE) return false;
    return moveTreeLogic(tree, dx, dz, scaleCost);
  },

  setTreeMesh: (mesh) => {
    get().tree.mesh = mesh;
  },
}));
