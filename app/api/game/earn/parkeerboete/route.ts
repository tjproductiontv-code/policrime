// app/api/game/earn/parkeerboete/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import {
  cooldownMs,
  investigationChance,
  investigationDurationMs,
  type EarnActionKey,
} from "../../../../../lib/game";

export const dynamic = "force-dynamic";

const ACTION: EarnActionKey = "parkeerboete";
const COOLDOWN_MS = cooldownMs(ACTION);
const REWARD_EURO = 50;

export async function POST() {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      money: true,
      level: true,
      lastParkeerboeteAt: true,
      investigationUntil: true,
    },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  // blokkeer tijdens lopend onderzoek
  if (user.investigationUntil && user.investigationUntil.getTime() > now.getTime()) {
    return NextResponse.json({ error: "UNDER_INVESTIGATION", until: user.investigationUntil }, { status: 403 });
  }

  // cooldown
  const lastAt = user.lastParkeerboeteAt?.getTime() ?? 0;
  if (lastAt + COOLDOWN_MS > now.getTime()) {
    const remainingMs = lastAt + COOLDOWN_MS - now.getTime();
    return NextResponse.json({ error: "COOLDOWN", remainingMs }, { status: 400 });
  }

  // kans op onderzoek
  const level = user.level ?? 1;
  const chance = investigationChance(ACTION, level);
  const triggered = Math.random() < chance;

  const updateData: Record<string, any> = {
    money: { increment: REWARD_EURO },
    lastParkeerboeteAt: now,
  };
  if (triggered) {
    updateData.investigationUntil = new Date(now.getTime() + investigationDurationMs(ACTION));
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, money: true, lastParkeerboeteAt: true },
  });

  await prisma.actionLog.create({
    data: { userId: user.id, type: "EARN_PARKEERBOETE", cost: 0, influenceChange: 0 },
  });

  return NextResponse.json({
    ok: true,
    money: updated.money,
    lastParkeerboeteAt: updated.lastParkeerboeteAt?.toISOString() ?? null,
    investigationStarted: triggered,
  });
}
