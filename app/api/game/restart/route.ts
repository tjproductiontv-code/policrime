// app/api/game/restart/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

// 10000 = 100.00% (twee decimalen)
const RESET_HP = 10000;

export async function POST() {
  try {
    const me = await getUserFromCookie();
    if (!me?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers: NO_STORE });
    }

    const out = await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: me.id },
        select: { id: true, money: true, votes: true, dossiers: true, hpBP: true, eliminatedAt: true },
      });
      if (!before) throw new Error("UserNotFound");

      const newMoney = 0;
      const newVotes = Math.max(0, (before.votes ?? 0) - 1000);
      const newDossiers = Math.max(0, Math.floor((before.dossiers ?? 0) / 2));

      const updated = await tx.user.update({
        where: { id: me.id },
        data: {
          money:        { set: newMoney },
          votes:        { set: newVotes },
          dossiers:     { set: newDossiers },
          level:        { set: 1 },
          levelProgress:{ set: 0 },
          hpBP:         { set: RESET_HP },   // ⭐ nu 10000
          eliminatedAt: { set: null },
        },
        select: {
          id: true, email: true, name: true,
          money: true, votes: true, dossiers: true,
          level: true, levelProgress: true,
          hpBP: true, eliminatedAt: true,
          civilServants: true, workspaceUnits: true,
        },
      });

      await tx.actionLog.create({
        data: { userId: me.id, type: "RESTART_KEEP_STAFF", cost: 0, influenceChange: 0 },
      });

      return { before, updated };
    });

    return NextResponse.json({ ok: true, ...out }, { headers: NO_STORE });
  } catch (err: any) {
    if (err?.message === "UserNotFound") {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404, headers: NO_STORE });
    }
    console.error("restart error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500, headers: NO_STORE });
  }
}
