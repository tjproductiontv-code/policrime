// lib/settleInvestigations.ts
import { prisma } from "./prisma";

/**
 * Zet alle onderzoeken van deze gebruiker waarvan de ETA verstreken is op 'completed'
 * en verlaag alléén investigatorsBusy. In het consumeer-model komen er géén
 * onderzoekers terug naar 'investigators'.
 */
export async function settleInvestigationsForUser(userId: number): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Pak alle niet-complete onderzoeken die klaar zijn
    const toFinish = await tx.investigation.findMany({
      where: { attackerId: userId, completedAt: null, etaAt: { lte: now } },
      select: { id: true, assigned: true },
    });
    if (toFinish.length === 0) return;

    const ids = toFinish.map((i) => i.id);
    const totalAssigned = toFinish.reduce((sum, i) => sum + i.assigned, 0);

    // Markeer als afgerond (dubbele write voorkomen met completedAt: null)
    await tx.investigation.updateMany({
      where: { id: { in: ids }, completedAt: null },
      data: { completedAt: now },
    });

    // Verlaag busy, maar clamp zodat het nooit negatief kan worden
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: { investigatorsBusy: true },
    });
    const currentBusy = u?.investigatorsBusy ?? 0;
    const decrementBy = Math.min(currentBusy, totalAssigned);

    if (decrementBy > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { investigatorsBusy: { decrement: decrementBy } },
      });
    }
  });
}
