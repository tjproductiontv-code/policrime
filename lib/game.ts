// lib/game.ts

// Tijd-constants (voor tests nu in seconden)
export const TEN_MIN = 10;              // 10 sec (test)
export const FOURTEEN_MIN = 14;         // 14 sec (test)
export const INVESTIGATION_SEC = 3 * 60; // 180 sec (3 min onderzoek)

// Economie
export const VOTE_PRICE = 100; // €100 per stem (pas aan naar wens)

// Basis-kansen op onderzoek op level 1
const BASE_INVESTIGATION = {
  nepfactuur: 0.25, // 25%
  vriendje: 0.5,    // 50%
} as const;

export type InvestigationAction = keyof typeof BASE_INVESTIGATION;

/**
 * Kans op onderzoek o.b.v. level.
 * Per level: kans *= 0.87 (relatieve daling).
 */
export function investigationChance(action: InvestigationAction, level: number): number {
  const base = BASE_INVESTIGATION[action];
  const factor = Math.pow(0.87, Math.max(0, level - 1));
  return Math.max(0, base * factor);
}

/** Restseconden tot target (absolute eindtijd). */
export function secondsRemaining(target?: Date | null): number {
  if (!target) return 0;
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

/**
 * Cooldown in seconden die nog over is t.o.v. lastAt + cooldownSec.
 * Typefix: geen verplicht argument na een optioneel argument.
 */
export function onCooldown(lastAt: Date | null | undefined, cooldownSec = 0): number {
  if (!lastAt) return 0;
  const remain = lastAt.getTime() + cooldownSec * 1000 - Date.now();
  return Math.max(0, Math.ceil(remain / 1000));
}
