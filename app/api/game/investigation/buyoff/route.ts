// app/api/game/investigation/buyoff/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

// Pas deze prijs aan naar jouw game rules
const BUYOFF_PRICE = 10; // €10 per seconde? (pas aan naar jouw bedoeling)

export async function POST() {
  const user = await getUserFromCookie(); // ✅ fix hier
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Voorbeeld: simpel “betaal & clear investigationUntil”
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { money: true, investigationUntil: true },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Hier kun je logica doen op basis van resterende tijd en prijs
  if ((me.money ?? 0) < BUYOFF_PRICE) {
    return NextResponse.json({ error: "Onvoldoende saldo" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      money: { decrement: BUYOFF_PRICE },
      investigationUntil: null, // vrijgekocht
    },
  });

  await prisma.actionLog.create({
    data: { userId: user.id, type: "INVESTIGATION_BUYOFF", cost: BUYOFF_PRICE, influenceChange: 0 },
  });

  return NextResponse.json({ ok: true });
}
