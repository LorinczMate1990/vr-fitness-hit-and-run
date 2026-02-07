// Growth rate: scale units per second
export const GROWTH_RATE = 0.02;
// How much growth is lost on hit (30 seconds worth)
export const HIT_PENALTY = GROWTH_RATE * 30;
// Min and max scale
export const MIN_SCALE = 0.3;
export const MAX_SCALE = 2.0;

/** Grow the tree each frame. Mutates in place. */
export function grow(tree: { scale: number }, deltaT: number): void {
  tree.scale = Math.min(MAX_SCALE, tree.scale + GROWTH_RATE * deltaT);
}

/** Apply damage to tree (reduce scale). Mutates in place. */
export function hitTree(tree: { scale: number }, damage: number): void {
  const penalty = damage > 0 ? damage : HIT_PENALTY;
  tree.scale = Math.max(MIN_SCALE, tree.scale - penalty);
}
