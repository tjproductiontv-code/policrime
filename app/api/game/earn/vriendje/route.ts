// app/api/game/earn/vriendje/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

// Pas deze constants aan als jij andere waarden wilt
const REWARD_EURO = 250;

export async function POST() {
  const user = getUserFromCookie();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Update user: geld erbij + cooldown timestamp zetten
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      money: { increment: REWARD_EURO },
      lastVriendjeAt: now,
    },
    select: { id: true, money: true, lastVriendjeAt: true }
  });

  // Log de actie (optioneel maar handig voor audits/leaderboards)
  await prisma.actionLog.create({
    data: {
      userId: user.id,
      type: "EARN_VRIENDJE",
      cost: 0,
      influenceChange: 0,
    },
  });

  return NextResponse.json({
    ok: true,
    money: updated.money,
    lastVriendjeAt: updated.lastVriendjeAt?.toISOString() ?? null,
  });
}
