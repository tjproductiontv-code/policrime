// app/api/game/level/add-progress/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { addProgress } from "../../../../../lib/leveling";
import { LEVELS } from "../../../../../lib/levels";

export async function POST(req: Request) {
  const me = getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const parsed = Number(body?.amount);
  const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const updated = await addProgress(user.id, amount);
  const levelInfo = LEVELS[updated.level] ?? { title: "Onbekend", description: "" };

  return NextResponse.json({
    ok: true,
    amountAdded: Number(amount.toFixed(2)),
    level: updated.level,
    levelProgress: Number(updated.levelProgress.toFixed(2)),
    rankTitle: levelInfo.title,
    rankDescription: levelInfo.description,
  });
}
