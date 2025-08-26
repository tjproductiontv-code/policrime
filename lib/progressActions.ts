// lib/progressActions.ts
import type { EarnActionKey } from "./game";

/**
 * Hoeveel level-progress levert een actie op?
 */
const BASE_PROGRESS: Record<EarnActionKey, number> = {
  nepfactuur: 8,
  vriendje: 12,
  parkeerboete: 5,
  donatie: 18,
  stemmenhandel: 10,
};

/**
 * Schaal met level: elke level minder progressie.
 */
function levelFactor(level: number): number {
  const steps = Math.max(0, level - 1);
  return Math.pow(0.65, steps); // voorbeeld
}

/** ✅ Geeft altijd een getal met 2 decimalen terug */
export function calcProgress(action: EarnActionKey, level: number): number {
  const base = BASE_PROGRESS[action] ?? 0;
  const raw = base * levelFactor(level);
  return Math.max(0, Math.round(raw * 100) / 100); // ⬅️ 2 decimalen
}
