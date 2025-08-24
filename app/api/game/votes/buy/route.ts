import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { VOTE_PRICE } from "@/lib/game";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { count } = await req.json().catch(() => ({}));
  const qty = Number(count);

  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ error: "INVALID_COUNT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, money: true, votes: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const cost = qty * VOTE_PRICE;
  if (user.money < cost) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS", cost }, { status: 402 });
  }

  // Atomisch updaten
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      money: { decrement: cost },
      votes: { increment: qty },
    },
    select: { money: true, votes: true },
  });

  return NextResponse.json({ ok: true, cost, ...updated });
}
