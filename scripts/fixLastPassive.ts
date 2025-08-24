// scripts/fixLastPassive.ts
import { prisma } from "../lib/prisma";

function floorToHour(d: Date): Date {
  const x = new Date(d);
  x.setMinutes(0, 0, 0);
  return x;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, lastPassiveAt: true },
  });

  for (const u of users) {
    if (!u.lastPassiveAt) continue;
    const floored = floorToHour(u.lastPassiveAt);
    if (floored.getTime() !== u.lastPassiveAt.getTime()) {
      await prisma.user.update({
        where: { id: u.id },
        data: { lastPassiveAt: floored },
      });
      console.log(`✅ User ${u.id}: lastPassiveAt afgerond naar ${floored}`);
    }
  }
}

main()
  .then(() => {
    console.log("Klaar!");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
