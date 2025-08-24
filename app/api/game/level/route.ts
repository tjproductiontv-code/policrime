// app/api/game/level/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { LEVELS } from "../../../../lib/levels";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = getUserFromCookie(); // { id: number } | null
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      email: true,
      name: true,
      level: true,
      levelProgress: true,
      money: true,
      votes: true,
      dossiers: true,
      hpBP: true,
      investigators: true,
      investigatorsBusy: true,
      passivePerHour: true,
      lastPassiveAt: true,
      lastNepfactuurAt: true,
      lastVriendjeAt: true,
      investigationUntil: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const info = LEVELS[user.level] ?? { title: "Onbekend", description: "" };
  return NextResponse.json({ ...user, ...info });
}
