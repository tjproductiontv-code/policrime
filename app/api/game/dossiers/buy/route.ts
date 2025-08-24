import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { DOSSIER_PRICE_EUR } from "@/lib/dossiers";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Math.floor(Number(body?.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, money: true, eliminatedAt: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    if (user.eliminatedAt) return NextResponse.json({ error: "ELIMINATED" }, { status: 423 });

    const cost = amount * DOSSIER_PRICE_EUR;
    if ((user.money ?? 0) < cost) {
      return NextResponse.json({ error: "INSUFFICIENT_FUNDS", need: cost }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        money: { decrement: cost },
        dossiers: { increment: amount },
      },
    });

    return NextResponse.json({ ok: true, bought: amount, cost });
  } catch (e: any) {
    console.error("buy dossiers error:", e);
    return NextResponse.json({ error: "SERVER_ERROR", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
