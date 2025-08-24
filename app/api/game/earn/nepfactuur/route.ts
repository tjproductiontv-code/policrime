// app/api/game/earn/nepfactuur/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import {
  TEN_MIN,
  investigationChance,
  REWARD_NEPFACTUUR_EUR as REWARD
} from "../../../../../lib/game";
import { addProgress } from "../../../../../lib/leveling";
import { calcProgress } from "../../../../../lib/progressActions";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, money: true, level: true, lastNepfactuurAt: true, investigationUntil: true }
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  // cooldown
  if (user.lastNepfactuurAt && user.lastNepfactuurAt.getTime() + TEN_MIN * 1000 > now.getTime()) {
    return NextResponse.json({ error: "COOLDOWN" }, { status: 400 });
  }

  // kans op onderzoek
  const chance = investigationChance("nepfactuur", user.level ?? 1);
  const triggerInvestigation = Math.random() < chance;
  const investigationUntil = triggerInvestigation ? new Date(now.getTime() + TEN_MIN * 1000) : user.investigationUntil ?? null;

  // beloning + progress
  const progressDelta = calcProgress("nepfactuur");
  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        money: { increment: REWARD },
        lastNepfactuurAt: now,
        investigationUntil,
      },
      select: { money: true, level: true, levelProgress: true }
    }),
    prisma.actionLog.create({
      data: { userId: user.id, type: "EARN_NEPFACTUUR", cost: 0, influenceChange: 0 }
    }),
  ]);

  // level-progress doorrekenen (als je addProgress zo gebruikt)
  await addProgress(user.id, progressDelta);

  return NextResponse.json({ ok: true, money: updated.money });
}
