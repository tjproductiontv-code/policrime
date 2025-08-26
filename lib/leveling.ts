// lib/leveling.ts
import { prisma } from "./prisma";
import { MAX_LEVEL } from "./levels";

/**
 * Voeg progressie toe aan een user.
 * - Werkt met floats (bv. 2.75%).
 * - Bij >=100 → level-up en overschot carry-over.
 * - Bij max level → progressie loopt gewoon door boven 100 (geen cap).
 */
export async function addProgress(userId: number, amountPercent: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { level: true, levelProgress: true },
    });
    if (!user) throw new Error("User not found");

    let level = user.level;
    let prog = (user.levelProgress ?? 0) + amountPercent;

    // Level-up loop zolang je nog niet aan max level zit
    while (prog >= 100 && level < MAX_LEVEL) {
      prog -= 100;
      level += 1;
    }

    // ✅ Bij max level: niet meer clampen, gewoon door laten lopen
    if (level >= MAX_LEVEL) {
      level = MAX_LEVEL;
      // prog NIET op 100 zetten → laten doorschieten
    }

    return tx.user.update({
      where: { id: userId },
      data: {
        level,
        levelProgress: parseFloat(prog.toFixed(2)), // 2 decimalen opslaan
      },
    });
  });
}
