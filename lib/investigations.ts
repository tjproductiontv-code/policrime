// lib/investigations.ts
export const INVESTIGATOR_PRICE = 2500; // € per onderzoeker (pas aan)
export const BASE_MIN_HOURS = 3;       // 3–4 uur bij 1 onderzoeker
export const BASE_MAX_HOURS = 4;
export const PER_INVESTIGATOR_FACTOR = 0.95; // -5% per extra onderzoeker
export const MIN_DURATION_MIN = 30;    // minimaal 30 minuten

/** random basisduur tussen 3–4 uur (in ms) */
function baseRandomMs() {
  const hrs = BASE_MIN_HOURS + Math.random() * (BASE_MAX_HOURS - BASE_MIN_HOURS);
  return hrs * 60 * 60 * 1000;
}

/** Hoeveel zwaarder is dit doelwit? 1.0 op level 1, +20% per extra level. */
export function levelPenaltyFactor(targetLevel: number): number {
  const L = Math.max(1, Math.floor(targetLevel || 1));
  return 1 + 0.20 * (L - 1); // ⬅️ was 0.05, nu 0.20
}

/**
 * Bereken duur in ms op basis van ingezette onderzoekers én level van het doelwit.
 * - assigned: aantal dat speler inzet
 * - targetLevel: level van doelwit
 * - effectieve onderzoekers = floor(assigned / penaltyFactor), min 1
 */
export function calcInvestigationDurationMs(assigned: number, targetLevel: number): number {
  const nAssigned = Math.max(1, Math.floor(assigned));
  const penalty = levelPenaltyFactor(targetLevel);
  const effective = Math.max(1, Math.floor(nAssigned / penalty));

  const base = baseRandomMs();
  const speedFactor = Math.pow(PER_INVESTIGATOR_FACTOR, Math.max(0, effective - 1));
  const ms = base * speedFactor;

  const minMs = MIN_DURATION_MIN * 60 * 1000;
  return Math.max(ms, minMs);
}
