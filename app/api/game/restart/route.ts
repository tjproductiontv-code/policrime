// app/api/game/restart/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      // beginstatus — pas aan naar wens
      money: 50,
      votes: 0,
      level: 1,
      levelProgress: 0,
      dossiers: 0,
      hpBP: 10000,
      eliminatedAt: null,

      passivePerHour: 0,
      lastPassiveAt: null,

      investigators: 0,
      investigatorsBusy: 0,

      lastNepfactuurAt: null,
      lastVriendjeAt: null,
      investigationUntil: null,
    },
    select: {
      id: true, email: true, money: true, votes: true,
      level: true, levelProgress: true, dossiers: true, hpBP: true
    },
  });

  await prisma.actionLog.create({
    data: { userId: me.id, type: "RESTART", cost: 0, influenceChange: 0 },
  });

  return NextResponse.json({ ok: true, user: updated });
}
