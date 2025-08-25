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

const ACTION: EarnActionKey = "stemmenhandel";
const COOLDOWN_MS = cooldownMs(ACTION);
const INVESTIGATION_MS = investigationDurationMs(ACTION);
const REPUTATION_PENALTY = 100; // 1% van 10000

// helper: random integer [min, max]
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function POST() {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      votes: true,
      hpBP: true,
      level: true,
      lastStemmenhandelAt: true,
      investigationUntil: true,
    },
  });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  // blokkeer tijdens lopend onderzoek
  if (user.investigationUntil && user.investigationUntil.getTime() > now.getTime()) {
    return NextResponse.json({ error: "UNDER_INVESTIGATION", until: user.investigationUntil }, { status: 403 });
  }

  // cooldown
  const lastAt = user.lastStemmenhandelAt?.getTime() ?? 0;
  if (lastAt + COOLDOWN_MS > now.getTime()) {
    const remainingMs = lastAt + COOLDOWN_MS - now.getTime();
    return NextResponse.json({ error: "COOLDOWN", remainingMs }, { status: 400 });
  }

  // kans op onderzoek
  const level = user.level ?? 1;
  const caught = Math.random() < investigationChance(ACTION, level);

  // bereken reward (alleen bij slagen)
  const rewardVotes = caught ? 0 : randInt(1, 10);

  // stel update samen
  const updateData: Record<string, any> = {
    lastStemmenhandelAt: now,
  };
  if (rewardVotes > 0) {
    updateData.votes = { increment: rewardVotes };
  }
  if (caught) {
    updateData.investigationUntil = new Date(now.getTime() + INVESTIGATION_MS);
    updateData.hpBP = Math.max(0, (user.hpBP ?? 10000) - REPUTATION_PENALTY);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { votes: true, hpBP: true, lastStemmenhandelAt: true },
  });

  await prisma.actionLog.create({
    data: { userId: user.id, type: "EARN_STEMMENHANDEL", cost: 0, influenceChange: 0 },
  });

  return NextResponse.json({
    ok: true,
    caught,
    rewardVotes, // 👈 laat de UI weten hoeveel stemmen er zijn ontvangen
    votes: updated.votes,
    hpBP: updated.hpBP,
    lastStemmenhandelAt: updated.lastStemmenhandelAt?.toISOString() ?? null,
  });
}
