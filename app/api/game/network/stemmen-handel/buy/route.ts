import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../../lib/auth";
import { VOTE_PRICE } from "../../../../../../lib/game";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const qty = Math.max(1, Math.min(1000, Number(body.qty ?? 1)));

  const uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key: "anika" } },
    select: { level: true, discountBps: true, discountValidUntil: true },
  });
  if (!uc || uc.level < 1) {
    return NextResponse.json({ error: "LOCKED", message: "Connectie nog niet sterk genoeg." }, { status: 403 });
  }

  const now = Date.now();
  const validUntilTs = uc.discountValidUntil?.getTime() ?? 0;
  if (!uc.discountBps || validUntilTs <= now) {
    return NextResponse.json({ error: "PRICE_EXPIRED" }, { status: 409 });
  }

  const unitPrice = Math.max(1, Math.floor((VOTE_PRICE * uc.discountBps) / 10000));
  const total = unitPrice * qty;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, votes: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  if ((user.money ?? 0) < total) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { money: { decrement: total }, votes: { increment: qty } },
    select: { money: true, votes: true },
  });

  await prisma.actionLog.create({
    data: { userId: me.id, type: "NETWORK_STEMMEN_BUY", cost: total, influenceChange: 0 },
  });

  return NextResponse.json({
    ok: true,
    price: unitPrice,
    qty,
    total,
    money: updated.money,
    votes: updated.votes,
  });
}
