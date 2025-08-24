// app/api/game/earn/vriendje/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  FOURTEEN_MIN,
  INVESTIGATION_SEC,
  onCooldown,
  secondsRemaining,
  investigationChance,
} from "@/lib/game";

import { addProgress } from "@/lib/leveling";
import { calcProgress } from "@/lib/progressActions";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      money: true,
      lastVriendjeAt: true,
      investigationUntil: true,
      level: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // Onderzoek actief?
  const investigationRemain = secondsRemaining(user.investigationUntil);
  if (investigationRemain > 0) {
    return NextResponse.json(
      { error: "UNDER_INVESTIGATION", remaining: investigationRemain },
      { status: 423 }
    );
  }

  // Cooldown?
  const cd = onCooldown(user.lastVriendjeAt, FOURTEEN_MIN);
  if (cd > 0) {
    return NextResponse.json({ error: "COOLDOWN", remaining: cd }, { status: 429 });
  }

  // Relatieve kans op onderzoek: base(50%) × 0.95^(level-1)
  const chance = investigationChance("vriendje", user.level);
  const fail = Math.random() < chance;
  if (fail) {
    const until = new Date(Date.now() + INVESTIGATION_SEC * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { investigationUntil: until, lastVriendjeAt: new Date() },
    });
    return NextResponse.json(
      {
        error: "INVESTIGATION_STARTED",
        duration: INVESTIGATION_SEC,
        investigationChance: chance,
      },
      { status: 409 }
    );
  }

  // ✅ Succes
  const reward = 250;
  const progressAmount = calcProgress("vriendje", user.level);

  await prisma.user.update({
    where: { id: user.id },
    data: { money: { increment: reward }, lastVriendjeAt: new Date() },
  });

  // update progress (retourneert nieuwe waarden)
  const updated = await addProgress(user.id, progressAmount);

  return NextResponse.json({
    ok: true,
    reward,
    progressGained: Number(progressAmount.toFixed(2)), // 2 decimalen
    investigationChance: chance,
    level: updated.level,
    levelProgress: Number(updated.levelProgress.toFixed(2)),
  });
}
