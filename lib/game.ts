export const TEN_MIN = 10;        // 10 sec (test)
export const FOURTEEN_MIN = 14;   // 14 sec (test)
export const INVESTIGATION_SEC = 3 * 60; // 180 sec (3 min onderzoek)

export const VOTE_PRICE = 100; // €100 per stem (pas hier aan wanneer je wilt)

// Basis-kansen op onderzoek (level 1)
const BASE_INVESTIGATION = {
  nepfactuur: 0.25,  // 25%
  vriendje: 0.5,     // 50%
} as const;

/**
 * Bereken kans op onderzoek voor een actie bij een gegeven level.
 * Elke level wordt kans *= 0.95 (dus -5% relatief per level).
 * Bijv: level 1 = 25%, level 2 = 23,75%, level 3 ≈ 22,56%, etc.
 */
export function investigationChance(
  action: keyof typeof BASE_INVESTIGATION,
  level: number
): number {
  const base = BASE_INVESTIGATION[action];
  const factor = Math.pow(0.87, Math.max(0, level - 1));
  return Math.max(0, base * factor);
}

export function secondsRemaining(target?: Date | null): number {
  if (!target) return 0;
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

export function onCooldown(lastAt?: Date | null, cooldownSec: number) {
  if (!lastAt) return 0;
  const remain = (lastAt.getTime() + cooldownSec * 1000) - Date.now();
  return Math.max(0, Math.ceil(remain / 1000));
}
