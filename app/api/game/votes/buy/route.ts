// app/api/game/votes/buy/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

// Pas aan naar jouw economie
const VOTE_PRICE = 100; // €10 per stem

export async function POST(req: Request) {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const rawCount = Number(body?.count);
  const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 1;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, money: true, votes: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const cost = count * VOTE_PRICE;
  if ((user.money ?? 0) < cost) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS", need: cost }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      money: { decrement: cost },
      votes: { increment: count },
    },
    select: { money: true, votes: true },
  });

  await prisma.actionLog.create({
    data: { userId: user.id, type: "BUY_VOTES", cost, influenceChange: 0 },
  });

  return NextResponse.json({ ok: true, money: updated.money, votes: updated.votes });
}
