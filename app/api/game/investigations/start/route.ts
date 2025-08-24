// app/api/game/investigations/start/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

// Voorbeeld: vaste duur 10 minuten (pas aan)
const INVESTIGATION_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const user = getUserFromCookie();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const targetId = Number(body?.targetId);
  const assigned = Number(body?.assigned ?? 1);

  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: "Ongeldig target" }, { status: 400 });
  }

  const now = new Date();
  const eta = new Date(now.getTime() + INVESTIGATION_MS);

  const inv = await prisma.investigation.create({
    data: {
      attackerId: user.id,
      targetId,
      assigned,
      startedAt: now,
      etaAt: eta,
    },
  });

  // Optioneel: zet busy-aantal omhoog
  await prisma.user.update({
    where: { id: user.id },
    data: { investigatorsBusy: { increment: assigned } },
  });

  await prisma.actionLog.create({
    data: { userId: user.id, type: "INVESTIGATION_START", cost: 0, influenceChange: 0 },
  });

  return NextResponse.json({ ok: true, investigationId: inv.id, eta: inv.etaAt.toISOString() });
}
