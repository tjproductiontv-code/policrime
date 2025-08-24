// app/api/game/dossiers/use/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { DAMAGE_PER_DOSSIER_BP } from "../../../../../lib/dossiers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const targetId = Number(body?.targetId);
  if (!targetId || targetId === me.id) {
    return NextResponse.json({ error: "INVALID_TARGET" }, { status: 400 });
  }

  const meRow = await prisma.user.findUnique({ where: { id: me.id }, select: { dossiers: true } });
  if (!meRow || (meRow.dossiers ?? 0) < 1) {
    return NextResponse.json({ error: "NO_DOSSIERS" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: me.id },
      data: { dossiers: { decrement: 1 } },
    }),
    prisma.user.update({
      where: { id: targetId },
      data: { hpBP: { decrement: DAMAGE_PER_DOSSIER_BP } },
    }),
    prisma.actionLog.create({
      data: { userId: me.id, type: "DOSSIERS_USE", cost: 0, influenceChange: 0 },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
