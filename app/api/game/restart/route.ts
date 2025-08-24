// app/api/game/restart/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const me = await getUserFromCookie();
    if (!me?.id) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({
        where: { id: me.id },
        select: {
          id: true,
          email: true,
          name: true,
          money: true,
          votes: true,
          dossiers: true,
          level: true,
          levelProgress: true,
          // Deze blijven bestaan en worden NIET aangepast
          civilServants: true,
          workspaceUnits: true,
        },
      });

      if (!u) throw new Error("UserNotFound");

      const newMoney = 0;
      const newVotes = Math.max(0, (u.votes ?? 0) - 1000);
      const newDossiers = Math.max(0, Math.floor((u.dossiers ?? 0) / 2));
      const newLevel = 1;
      const newLevelProgress = 0;

      const after = await tx.user.update({
        where: { id: me.id },
        data: {
          money: { set: newMoney },
          votes: { set: newVotes },
          dossiers: { set: newDossiers },
          level: { set: newLevel },
          levelProgress: { set: newLevelProgress },
          // ⚠️ NIETS aanpassen aan personeel/werkplekken
          // civilServants / workspaceUnits blijven zoals ze zijn
        },
        select: {
          id: true,
          email: true,
          name: true,
          money: true,
          votes: true,
          dossiers: true,
          level: true,
          levelProgress: true,
          civilServants: true,
          workspaceUnits: true,
        },
      });

      await tx.actionLog.create({
        data: { userId: me.id, type: "RESTART_KEEP_STAFF", cost: 0, influenceChange: 0 },
      });

      return {
        before: {
          money: u.money ?? 0,
          votes: u.votes ?? 0,
          dossiers: u.dossiers ?? 0,
          level: u.level ?? 1,
          levelProgress: u.levelProgress ?? 0,
        },
        after,
      };
    });

    return NextResponse.json({
      ok: true,
      user: updated.after,
      delta: {
        money: -(updated.before.money ?? 0),
        votes: (updated.after.votes ?? 0) - (updated.before.votes ?? 0),
        dossiers: (updated.after.dossiers ?? 0) - (updated.before.dossiers ?? 0),
        level: (updated.after.level ?? 1) - (updated.before.level ?? 1),
        levelProgress: (updated.after.levelProgress ?? 0) - (updated.before.levelProgress ?? 0),
      },
    });
  } catch (err: any) {
    if (err?.message === "UserNotFound") {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }
    console.error("restart error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
