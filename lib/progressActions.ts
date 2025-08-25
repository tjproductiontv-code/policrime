// lib/progressActions.ts
import type { EarnActionKey } from "./game";

/**
 * Hoeveel level-progress levert een actie op?
 * Je kunt deze waarden later tweaken. Het zijn 'punten', jouw addProgress
 * bepaalt hoe die naar percentage vertaald worden.
 */
const BASE_PROGRESS: Record<EarnActionKey, number> = {
  nepfactuur: 12,       // voorbeeldwaardes
  vriendje: 15,
  parkeerboete: 8,
  donatie: 20,
  stemmenhandel: 10,
};

/**
 * Optioneel: schaal iets met level (bijv. hogere levels iets minder progress per klik).
 * Hier: elke 5 levels ~10% minder (factor 0.9^(level-1)/5).
 * Pas gerust aan of zet gewoon `return BASE_PROGRESS[action];` als je niet wilt schalen.
 */
function levelFactor(level: number): number {
  const steps = Math.max(0, level - 1) / 5;
  return Math.pow(0.9, steps);
}

/** ✅ Verbrede signature: accepteert álle EarnActionKey’s */
export function calcProgress(action: EarnActionKey, level: number): number {
  const base = BASE_PROGRESS[action] ?? 0;
  return Math.max(0, Math.round(base * levelFactor(level)));
}
