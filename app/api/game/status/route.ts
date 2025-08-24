// app/api/game/status/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true, email: true, name: true,
      level: true, levelProgress: true,
      money: true, votes: true, dossiers: true,
      hpBP: true, eliminatedAt: true,
      passivePerHour: true, lastPassiveAt: true,
      investigators: true, investigatorsBusy: true,
      investigationUntil: true,
      lastNepfactuurAt: true, lastVriendjeAt: true,
      influence: true, createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true, user });
}
