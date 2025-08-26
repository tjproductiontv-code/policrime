// app/api/game/spend/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const raw = Number(body?.amount);
  const amount = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  const reason = String(body?.reason ?? "SPEND");

  if (amount <= 0) {
    return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, money: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  if ((user.money ?? 0) < amount) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS", need: amount }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { money: { decrement: amount } },
    select: { money: true },
  });

  await prisma.actionLog.create({
    data: { userId: user.id, type: reason, cost: amount, influenceChange: 0 },
  });

  return NextResponse.json({ ok: true, money: updated.money });
}
