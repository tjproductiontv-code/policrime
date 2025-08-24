// lib/passive.ts
import { prisma } from "@/lib/prisma";

/** Rondt een datum naar beneden af op het vorige hele uur. */
function floorToHour(d: Date): Date {
  const x = new Date(d);
  x.setMinutes(0, 0, 0);
  return x;
}

/** Geeft het volgende hele uur terug op basis van een referentie. */
export function nextWholeHour(from: Date = new Date()): Date {
  const f = floorToHour(from);
  return new Date(f.getTime() + 60 * 60 * 1000);
}

/**
 * Schrijft passief inkomen bij voor alle volledige uren sinds lastPassiveAt.
 * - Align op hele uren (13:00, 14:00, …).
 * - Eerste keer: zet lastPassiveAt naar het vorige hele uur zodat
 *   de eerste uitbetaling op het volgende hele uur valt.
 */
export async function settlePassiveIncome(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passivePerHour: true, lastPassiveAt: true },
  });
  if (!user) return;

  const rate = user.passivePerHour ?? 0;
  const now = new Date();
  const nowHour = floorToHour(now);

  // Bepaal ons anker (vanaf-tijd is altijd een heel uur)
  const anchor = user.lastPassiveAt ? floorToHour(user.lastPassiveAt) : floorToHour(now);

  // Als we nog geen lastPassiveAt hadden, zet hem nu alvast op het vorige hele uur.
  // Zo valt de eerste uitbetaling netjes op het volgende hele uur.
  if (!user.lastPassiveAt) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastPassiveAt: anchor },
    });
  }

  // Geen passief inkomen? Dan hoeven we niet uit te betalen,
  // maar we laten lastPassiveAt wel staan/zetten hem (boven) zodat
  // zodra rate > 0 wordt, de klok al uitgelijnd is.
  if (rate <= 0) return;

  // Volledige uren die zijn verstreken sinds het anker
  const hoursPassed = Math.floor((nowHour.getTime() - anchor.getTime()) / (60 * 60 * 1000));
  if (hoursPassed <= 0) return;

  const amount = hoursPassed * rate;

  // Betaal uit en align lastPassiveAt naar het huidige hele uur
  await prisma.user.update({
    where: { id: userId },
    data: {
      money: { increment: amount },
      lastPassiveAt: nowHour,
    },
  });
}

/**
 * Handige helper voor UI: bereken ISO-tijd van de volgende uitbetaling.
 * Als lastPassiveAt ontbreekt, nemen we het vorige hele uur van "nu"
 * en geven we het volgende hele uur terug.
 */
export function nextPayoutISO(lastPassiveAt?: Date | null): string | null {
  const base = lastPassiveAt ? floorToHour(lastPassiveAt) : floorToHour(new Date());
  const next = new Date(base.getTime() + 60 * 60 * 1000);
  return next.toISOString();
}
