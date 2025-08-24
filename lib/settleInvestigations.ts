import { prisma } from "@/lib/prisma";

/** Markeer alle verlopen onderzoeken als completed en geef onderzoekers vrij. */
export async function settleInvestigationsForUser(userId: number) {
  const now = new Date();
  // Pak alle niet-complete onderzoeken van deze aanvaller die klaar zijn
  const toFinish = await prisma.investigation.findMany({
    where: { attackerId: userId, completedAt: null, etaAt: { lte: now } },
    select: { id: true, assigned: true },
  });
  if (toFinish.length === 0) return;

  const totalToFree = toFinish.reduce((s, i) => s + i.assigned, 0);

  await prisma.$transaction([
    prisma.investigation.updateMany({
      where: { id: { in: toFinish.map(i => i.id) } },
      data: { completedAt: now },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { investigatorsBusy: { decrement: totalToFree } },
    }),
  ]);
}
