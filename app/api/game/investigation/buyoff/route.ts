// app/api/game/investigation/buyoff/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const PRICE_PER_SEC = 10; // €10 per seconde

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, money: true, investigationUntil: true },
  });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  const remainingSec = user.investigationUntil
    ? Math.max(0, Math.ceil((user.investigationUntil.getTime() - Date.now()) / 1000))
    : 0;

  if (remainingSec <= 0) {
    return NextResponse.json({ error: "NO_INVESTIGATION" }, { status: 400 });
  }

  const price = remainingSec * PRICE_PER_SEC;

  if (user.money < price) {
    return NextResponse.json(
      { error: "INSUFFICIENT_FUNDS", price, money: user.money },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      money: { decrement: price },
      investigationUntil: null, // onderzoek beëindigen
    },
  });

  return NextResponse.json({ ok: true, priceCharged: price, remainingSec });
}
