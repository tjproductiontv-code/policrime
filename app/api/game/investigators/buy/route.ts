import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { INVESTIGATOR_PRICE } from "@/lib/investigations";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const qty = Math.max(1, Math.floor(Number(body?.count)));
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, money: true },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const cost = qty * INVESTIGATOR_PRICE;
  if ((user.money ?? 0) < cost) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS", need: cost }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      money: { decrement: cost },
      investigators: { increment: qty },
    },
    select: { investigators: true, money: true },
  });

  return NextResponse.json({ ok: true, ...updated });
}
