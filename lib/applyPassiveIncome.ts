// lib/applyPassiveIncome.ts
import { prisma } from "@/lib/prisma";

const HOUR = 3_600_000;
const floorToHour = (d: Date) => new Date(Math.floor(d.getTime() / HOUR) * HOUR);

export async function applyPassiveIncome(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { money: true, passivePerHour: true, lastPassiveAt: true },
  });
  if (!user) return;

  const nowFloor = floorToHour(new Date());

  // Eerste keer: initialiseren op begin van het huidige uur (geen uitbetaling)
  if (!user.lastPassiveAt) {
    await prisma.user.update({
      where: { email },
      data: { lastPassiveAt: nowFloor },
    });
    return;
  }

  // Betaal alleen volledige uurgrenzen uit
  const hours = Math.floor((nowFloor.getTime() - user.lastPassiveAt.getTime()) / HOUR);
  if (hours <= 0 || user.passivePerHour <= 0) return;

  // Uitbetalen en vastklikken op de hele uurgrens
  await prisma.user.update({
    where: { email },
    data: {
      money: { increment: user.passivePerHour * hours },
      lastPassiveAt: nowFloor, // ← dit was 'lastPassi'
    },
  });
}
