// lib/leveling.ts
import { prisma } from "./prisma";
import { MAX_LEVEL } from "./levels";

/**
 * Voeg progressie toe aan een user.
 * - Werkt met floats (bv. 2.75%).
 * - Bij >=100 → level-up en overschot carry-over.
 * - Bij max level → progressie capped op 100.
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

    // Level-up loop
    while (prog >= 100 && level < MAX_LEVEL) {
      prog -= 100;
      level += 1;
    }

    // Level-cap
    if (level >= MAX_LEVEL) {
      level = MAX_LEVEL;
      prog = 100.0; // cap
    }

    return tx.user.update({
      where: { id: userId },
      data: {
        level,
        levelProgress: prog,
      },
    });
  });
}
