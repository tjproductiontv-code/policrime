import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import {
  cooldownMs,
  investigationChance,
  investigationDurationMs,
  type EarnActionKey,
} from "../../../../../lib/game";
import { addProgress } from "../../../../../lib/leveling";
import { calcProgress } from "../../../../../lib/progressActions";

export const dynamic = "force-dynamic";

const ACTION: EarnActionKey = "nepfactuur";
const COOLDOWN_MS = cooldownMs(ACTION);
const REWARD = 100;

export async function POST() {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      money: true,
      level: true,
      lastNepfactuurAt: true,
      investigationUntil: true,
    },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  // ⛔ blokkeer als er nog een onderzoek loopt
  if (user.investigationUntil && user.investigationUntil.getTime() > now.getTime()) {
    return NextResponse.json(
      { error: "UNDER_INVESTIGATION", until: user.investigationUntil },
      { status: 403 }
    );
  }

  // ⏳ cooldown check
  const lastAt = user.lastNepfactuurAt?.getTime() ?? 0;
  if (lastAt + COOLDOWN_MS > now.getTime()) {
    const remainingMs = lastAt + COOLDOWN_MS - now.getTime();
    return NextResponse.json({ error: "COOLDOWN", remainingMs }, { status: 400 });
  }

  // 🎲 kans op onderzoek
  const level = user.level ?? 1;
  const chance = investigationChance(ACTION, level);
  const triggered = Math.random() < chance;

  // update data
  const updateData: Record<string, any> = {
    money: { increment: REWARD },
    lastNepfactuurAt: now,
  };
  if (triggered) {
    updateData.investigationUntil = new Date(now.getTime() + investigationDurationMs(ACTION));
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { money: true, level: true, levelProgress: true },
    }),
    prisma.actionLog.create({
      data: { userId: user.id, type: "EARN_NEPFACTUUR", cost: 0, influenceChange: 0 },
    }),
  ]);

  // 📈 level-progress
  const progressDelta = calcProgress(ACTION, level);
  await addProgress(user.id, progressDelta);

  return NextResponse.json({
    ok: true,
    money: updated.money,
    investigationStarted: triggered,
  });
}
