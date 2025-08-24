// app/api/game/dossiers/buy/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { DOSSIER_PRICE_EUR } from "../../../../../lib/dossiers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const count = Math.max(1, Math.floor(Number(body?.count ?? 1)));
  const cost = count * DOSSIER_PRICE_EUR;

  const u = await prisma.user.findUnique({ where: { id: me.id }, select: { money: true } });
  if (!u) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  if ((u.money ?? 0) < cost) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS", need: cost }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { money: { decrement: cost }, dossiers: { increment: count } },
    select: { money: true, dossiers: true }
  });

  await prisma.actionLog.create({ data: { userId: me.id, type: "DOSSIERS_BUY", cost, influenceChange: 0 } });

  return NextResponse.json({ ok: true, ...updated });
}
