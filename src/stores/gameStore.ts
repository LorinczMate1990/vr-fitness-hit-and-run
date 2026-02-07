import { create } from "zustand";
import { Vector3, type Mesh } from "three";
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

// Distance threshold to count as hitting the target
const TARGET_HIT_DISTANCE = 0.5;
// Damage dealt when bull hits tree
const BULL_DAMAGE = 0.6;

interface GameStore {
  bullEnemy: BullEnemyState & { mesh: Mesh | null; lastTargetHitTime: number };
  tree: TreeState & { mesh: Mesh | null };

  // Bull enemy actions
  tickBullEnemy: (deltaT: number, cameraY: number) => void;
  hitBullEnemy: (impact: Vector3) => void;
  setBullEnemyMesh: (mesh: Mesh | null) => void;

  // Tree actions
  tickTree: (deltaT: number) => void;
  hitTree: (damage: number) => void;
  moveTree: (dx: number, dz: number, scaleCost: number) => boolean;
  setTreeMesh: (mesh: Mesh | null) => void;
}

// Config — lives here since it's game-level setup
const bullEnemyConfig: BullEnemyConfig = {
  health: 100,
  position: new Vector3(0, 1.7, -5),
  maxSpeed: 8,
  acceleration: 4.5,
  hitSpeedThreshold: 3,
  stateDurationStartValue: 2,
};

const TREE_INITIAL_POSITION: [number, number, number] = [0, 0, -2];

export const useGameStore = create<GameStore>((_, get) => ({
  bullEnemy: {
    ...createBullEnemyState(bullEnemyConfig),
    mesh: null,
    lastTargetHitTime: 0,
  },
  tree: {
    ...createTreeState(TREE_INITIAL_POSITION),
    mesh: null,
  },

  tickBullEnemy: (deltaT, cameraY) => {
    const { bullEnemy, tree } = get();

    // Target position: tree's XZ but camera's Y
    const targetPosition = new Vector3(
      tree.position[0],
      cameraY,
      tree.position[2]
    );

    // Run AI logic (mutates bullEnemy in place)
    tickBullEnemyAI(bullEnemy, deltaT, targetPosition);

    // Check collision with tree
    if (bullEnemy.mode === "attack") {
      const now = performance.now();
      if (now - bullEnemy.lastTargetHitTime >= 500) {
        const dist = bullEnemy.position.distanceTo(targetPosition);
        if (dist < TARGET_HIT_DISTANCE) {
          bullEnemy.lastTargetHitTime = now;
          hitTreeLogic(tree, BULL_DAMAGE);
        }
      }
    }
  },

  hitBullEnemy: (impact) => {
    hitBullEnemyAI(get().bullEnemy, impact);
  },

  setBullEnemyMesh: (mesh) => {
    get().bullEnemy.mesh = mesh;
  },

  tickTree: (deltaT) => {
    growTree(get().tree, deltaT);
  },

  hitTree: (damage) => {
    hitTreeLogic(get().tree, damage);
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
