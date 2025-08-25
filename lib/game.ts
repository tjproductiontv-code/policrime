// lib/game.ts

// ✅ Cooldowns per actie (in seconden)
export const COOLDOWN_SEC = {
  parkeerboete: 60,    // 1 minuut
  nepfactuur: 14,      // 14 seconden
  vriendje: 14,        // 14 seconden
  donatie: 5 * 60,     // 5 minuten
  stemmenhandel: 5 * 60, // 5 minuten
} as const;

// ✅ Onderzoeksduur per actie (in seconden)
export const INVESTIGATION_SEC = {
  parkeerboete: 3 * 60,   // 3 minuten
  nepfactuur: 3 * 60,     // 3 minuten
  vriendje: 5 * 60,       // 5 minuten
  donatie: 5 * 60,        // 5 minuten
  stemmenhandel: 10 * 60, // 10 minuten
} as const;

// 💰 Economie
export const VOTE_PRICE = 100; // €100 per stem (pas aan naar wens)

// 📊 Basis-kansen op onderzoek op level 1
const BASE_INVESTIGATION = {
  parkeerboete: 0.20,   // 20%
  nepfactuur: 0.25,     // 25%
  vriendje: 0.50,       // 50%
  donatie: 0.75,        // 75%
  stemmenhandel: 0.60,  // 60%
} as const;

export type EarnActionKey = keyof typeof BASE_INVESTIGATION;

/**
 * Kans op onderzoek o.b.v. level.
 * Per level: kans *= 0.87 (relatieve daling).
 */
export function investigationChance(action: EarnActionKey, level: number): number {
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
 */
export function onCooldown(lastAt: Date | null | undefined, cooldownSec = 0): number {
  if (!lastAt) return 0;
  const remain = lastAt.getTime() + cooldownSec * 1000 - Date.now();
  return Math.max(0, Math.ceil(remain / 1000));
}

/** Hulpfunctie om onderzoeksduur in ms te krijgen */
export function investigationDurationMs(action: EarnActionKey): number {
  return INVESTIGATION_SEC[action] * 1000;
}

/** Hulpfunctie om cooldown in ms te krijgen */
export function cooldownMs(action: EarnActionKey): number {
  return COOLDOWN_SEC[action] * 1000;
}
