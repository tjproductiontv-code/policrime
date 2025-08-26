// app/api/game/network/connect/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";
import {
  CONNECT_SUCCESS_CHANCE,
  randomProgressBps,
  type NetworkKey,
} from "../../../../../lib/network";

export const dynamic = "force-dynamic";

// cooldown in ms (5 minuten)
const CONNECT_COOLDOWN_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  const me = await getUserFromCookie(); // ✅ await toegevoegd
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const key = (body?.key as NetworkKey) ?? "anika";

  // haal (of maak) de connectie
  let uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key } },
  });

  if (!uc) {
    uc = await prisma.userConnection.create({
      data: { userId: me.id, key, level: 0, progressBps: 0 }, // ⬅️ level start op 0
    });
  }

  // COOLDOWN CHECK
  const now = Date.now();
  const last = uc.lastConnectAt?.getTime() ?? 0;
  if (last + CONNECT_COOLDOWN_MS > now) {
    const remainingMs = Math.max(0, last + CONNECT_COOLDOWN_MS - now);
    return NextResponse.json({ error: "COOLDOWN", remainingMs }, { status: 400 });
  }

  // kans & voortgang
  const success = Math.random() < CONNECT_SUCCESS_CHANCE;
  let addedBps = 0;
  let newLevel = uc.level;
  let newProgress = uc.progressBps;

  if (success) {
    addedBps = randomProgressBps(uc.level);
    newProgress = Math.min(10000, uc.progressBps + addedBps);
    if (newProgress >= 10000) {
      newLevel = uc.level + 1;
      newProgress = 0; // reset voor volgend level
    }
  }

  const updated = await prisma.userConnection.update({
    where: { userId_key: { userId: me.id, key } },
    data: {
      level: newLevel,
      progressBps: newProgress,
      lastProgressAt: new Date(),
      lastConnectAt: new Date(), // ✅ cooldown start hier
      unlockedAt: uc.unlockedAt ?? (newLevel > uc.level ? new Date() : null),
    },
    select: { level: true, progressBps: true },
  });

  return NextResponse.json({
    ok: true,
    success,
    addedBps,
    level: updated.level,
    progressBps: updated.progressBps,
  });
}
