// app/api/game/earn/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; // laat dit zo als het pad klopt
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // amount mag number of string zijn; minimaal 1 euro; we gebruiken hele euro's
    const body = await req.json().catch(() => ({} as any));
    const parsed = Math.floor(Number(body?.amount));
    const amount = Number.isFinite(parsed) ? parsed : NaN;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, money: true },
    });
    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { money: { increment: amount } },
      select: { money: true },
    });

    return NextResponse.json({
      ok: true,
      added: amount,
      money: updated.money,
    });
  } catch (err) {
    console.error("earn route error:", err);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
