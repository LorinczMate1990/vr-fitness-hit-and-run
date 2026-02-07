// Growth rate: scale units per second
export const GROWTH_RATE = 0.02;
// How much growth is lost on hit (30 seconds worth)
export const HIT_PENALTY = GROWTH_RATE * 30;
// Min and max scale
export const MIN_SCALE = 0.3;
export const MAX_SCALE = 2.0;

export interface TreeState {
  position: [number, number, number];
  scale: number;
}

export function createTreeState(
  position: [number, number, number]
): TreeState {
  return {
    position: [...position],
    scale: 1.0,
  };
}

/** Grow the tree each frame. Mutates state in place. */
export function grow(state: TreeState, deltaT: number): void {
  state.scale = Math.min(MAX_SCALE, state.scale + GROWTH_RATE * deltaT);
}

/** Apply damage to tree (reduce scale). Mutates state in place. */
export function hitTree(state: TreeState, damage: number): void {
  const penalty = damage > 0 ? damage : HIT_PENALTY;
  state.scale = Math.max(MIN_SCALE, state.scale - penalty);
}

/**
 * Move the tree on the XZ plane if it has enough scale to pay the cost.
 * Returns true if the move was applied.
 */
export function moveTree(
  state: TreeState,
  dx: number,
  dz: number,
  scaleCost: number
): boolean {
  if (state.scale - scaleCost >= MIN_SCALE) {
    state.position[0] += dx;
    state.position[2] += dz;
    state.scale -= scaleCost;
    return true;
  }
  return false;
}
