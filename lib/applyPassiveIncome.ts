// lib/applyPassiveIncome.ts
import { prisma } from "./prisma";

/**
 * Past passief inkomen toe voor een gebruiker op basis van verstreken volle uren.
 * userOrEmail: number (user.id) of string (user.email)
 *
 * Werkwijze:
 * - Als lastPassiveAt leeg is: we initialiseren 'm op nu en betalen nog niet uit.
 * - Anders: berekenen we het aantal volledige uren dat verstreken is,
 *   betalen we per uur uit en schuiven we lastPassiveAt overeenkomstig door.
 */
export async function applyPassiveIncome(userOrEmail: number | string) {
  const where =
    typeof userOrEmail === "number" ? { id: userOrEmail } : { email: userOrEmail };

  const u = await prisma.user.findUnique({
    where,
    select: {
      id: true,
      money: true,
      passivePerHour: true,
      lastPassiveAt: true,
    },
  });

  if (!u) {
    return { applied: 0, nextAt: null as Date | null };
  }

  const perHour = u.passivePerHour ?? 0;
  const now = new Date();

  // Geen passief inkomen ingesteld → alleen initialiseren lastPassiveAt als die nog leeg is
  if (perHour <= 0) {
    if (!u.lastPassiveAt) {
      await prisma.user.update({
        where: { id: u.id },
        data: { lastPassiveAt: now },
      });
    }
    const base = u.lastPassiveAt ?? now;
    return { applied: 0, nextAt: new Date(base.getTime() + 60 * 60 * 1000) };
  }

  // Eerste keer? Initialiseer en betaal nog niets uit
  if (!u.lastPassiveAt) {
    await prisma.user.update({
      where: { id: u.id },
      data: { lastPassiveAt: now },
    });
    return { applied: 0, nextAt: new Date(now.getTime() + 60 * 60 * 1000) };
  }

  // Bepaal hoeveel volle uren verstreken zijn sinds lastPassiveAt
  const elapsedMs = now.getTime() - u.lastPassiveAt.getTime();
  const fullHours = Math.floor(elapsedMs / (60 * 60 * 1000));

  if (fullHours <= 0) {
    return { applied: 0, nextAt: new Date(u.lastPassiveAt.getTime() + 60 * 60 * 1000) };
  }

  const payout = fullHours * perHour;
  const newLast = new Date(u.lastPassiveAt.getTime() + fullHours * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: u.id },
      data: {
        money: { increment: payout },
        lastPassiveAt: newLast,
      },
    }),
    prisma.actionLog.create({
      data: { userId: u.id, type: "PASSIVE_INCOME_APPLY", cost: 0, influenceChange: 0 },
    }),
  ]);

  // Volgende uitbetaling 1 uur na newLast
  return { applied: payout, nextAt: new Date(newLast.getTime() + 60 * 60 * 1000) };
}
