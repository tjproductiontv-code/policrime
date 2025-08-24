// lib/progressActions.ts

const BASE_PROGRESS = {
  nepfactuur: 5,
  vriendje: 8,
} as const;

export type ActionKey = keyof typeof BASE_PROGRESS;

/**
 * Bereken progressie in procenten (float).
 * Elke level is 25% moeilijker: factor = 1 + 0.25 * (level - 1)
 */
export function calcProgress(action: ActionKey, level: number): number {
  const base = BASE_PROGRESS[action];
  if (!base) return 0;

  const factor = 1 + 0.25 * Math.max(0, level - 1);
  return base / factor; // float met decimalen
}
