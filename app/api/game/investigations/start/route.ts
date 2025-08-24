// app/api/game/investigations/start/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calcInvestigationDurationMs, levelPenaltyFactor } from "@/lib/investigations";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetName = String(body?.targetName || "").trim();
  const count = Math.max(1, Math.floor(Number(body?.count)));

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, investigators: true, investigatorsBusy: true },
  });
  if (!me) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  if (!targetName) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const target = await prisma.user.findFirst({
    where: { name: targetName },
    select: { id: true, level: true, eliminatedAt: true },
  });
  if (!target) return NextResponse.json({ error: "TARGET_NOT_FOUND" }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "CANT_TARGET_SELF" }, { status: 400 });
  if (target.eliminatedAt) return NextResponse.json({ error: "TARGET_ELIMINATED" }, { status: 409 });

  // Beschikbaar = totaal - busy
  const available = (me.investigators ?? 0) - (me.investigatorsBusy ?? 0);
  if (available < count) {
    return NextResponse.json({ error: "INSUFFICIENT_INVESTIGATORS", available }, { status: 400 });
  }

  const now = new Date();
  const durationMs = calcInvestigationDurationMs(count, target.level ?? 1);
  const etaAt = new Date(now.getTime() + durationMs);

  // (optioneel) stuur wat context terug voor UI-hint
  const penalty = levelPenaltyFactor(target.level ?? 1);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: me.id },
      data: { investigatorsBusy: { increment: count } },
    }),
    prisma.investigation.create({
      data: {
        attackerId: me.id,
        targetId: target.id,
        assigned: count,
        startedAt: now,
        etaAt,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    etaAt: etaAt.toISOString(),
    info: {
      targetLevel: target.level ?? 1,
      penaltyFactor: penalty, // bv. 1.25 = +25% zwaarder dan level 1
    },
  });
}
