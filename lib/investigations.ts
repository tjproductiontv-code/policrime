// lib/investigations.ts
export const INVESTIGATOR_PRICE = 2500;

// Basisduur: 2–3 uur
const BASE_MIN_HOURS = 2;
const BASE_MAX_HOURS = 3;

// Elk extra persoon boven de 1 reduceert duur met 3% (multiplicatief)
const REDUCTION_PER_EXTRA = 0.03;

// ✅ Ondergrens: nooit onder 30 minuten
const MIN_DURATION_MIN = 30;

export function minInvestigatorsForRank(targetLevel: number): number {
  return Math.max(1, 1 + Math.floor(Math.max(0, targetLevel - 1) / 4));
}

export function durationMultiplierForRank(targetLevel: number): number {
  return 1 + Math.max(0, targetLevel - 1) * 0.05;
}

/** Echte ETA met random basis (2–3u) – gebruikt bij aanmaken van onderzoek */
export function computeInvestigationETA(
  assigned: number,
  targetLevel: number,
  now = new Date()
): Date {
  const baseHours =
    BASE_MIN_HOURS + Math.random() * (BASE_MAX_HOURS - BASE_MIN_HOURS);
  const extra = Math.max(0, assigned - 1);
  const reductionFactor = Math.pow(1 - REDUCTION_PER_EXTRA, extra);
  const rankMult = durationMultiplierForRank(targetLevel);
  const hours = baseHours * reductionFactor * rankMult;

  const ms = hours * 60 * 60 * 1000;
  const clampedMs = Math.max(MIN_DURATION_MIN * 60 * 1000, Math.round(ms));

  return new Date(now.getTime() + clampedMs);
}

/** Schatting zonder random: neem het gemiddelde (2.5u) voor UI-indicatie */
export function estimateInvestigationMs(
  assigned: number,
  targetLevel: number
): number {
  const baseMeanHours = (BASE_MIN_HOURS + BASE_MAX_HOURS) / 2; // 2.5u
  const extra = Math.max(0, assigned - 1);
  const reductionFactor = Math.pow(1 - REDUCTION_PER_EXTRA, extra);
  const rankMult = durationMultiplierForRank(targetLevel);
  const hours = baseMeanHours * reductionFactor * rankMult;

  const ms = hours * 60 * 60 * 1000;
  return Math.max(MIN_DURATION_MIN * 60 * 1000, Math.round(ms));
}

/** 2u 15m / 45m / 1u formatter */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60000)); // min 1 minuut
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}u ${m}m`;
  if (h > 0) return `${h}u`;
  return `${m}m`;
}
