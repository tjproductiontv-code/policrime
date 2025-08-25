// lib/network.ts
export type NetworkKey = "anika"; // later uitbreiden

// Progressie (in basispunten)
export const PROGRESS_LVL1_MIN_BPS = 5;   // 0.05%
export const PROGRESS_LVL1_MAX_BPS = 13;  // 0.13%
export const PROGRESS_LVL2_MIN_BPS = 3;   // 0.03%
export const PROGRESS_LVL2_MAX_BPS = 9;   // 0.09%

// Succes-kans (0..1)
export const CONNECT_SUCCESS_CHANCE = 0.75;

// Korting elke 30 minuten
export const DISCOUNT_SLOT_MINUTES = 30;

// Korting-ranges in % van VOTE_PRICE, uitgedrukt in bps (10000 = 100,00%)
export const DISCOUNT_RANGE: Record<number, { minBps: number; maxBps: number }> = {
  1: { minBps: 7500, maxBps: 9000 }, // 75–90%
  2: { minBps: 6000, maxBps: 8000 }, // 60–80%
};

// Random helpers
export const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function randomProgressBps(level: number): number {
  if (level >= 2) return randInt(PROGRESS_LVL2_MIN_BPS, PROGRESS_LVL2_MAX_BPS);
  return randInt(PROGRESS_LVL1_MIN_BPS, PROGRESS_LVL1_MAX_BPS);
}

export function randomDiscountBps(level: number): number {
  const r = DISCOUNT_RANGE[level] ?? DISCOUNT_RANGE[1];
  return randInt(r.minBps, r.maxBps);
}
