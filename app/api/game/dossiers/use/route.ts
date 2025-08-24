// app/api/game/dossiers/use/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "<relatief pad>/lib/auth";
import { prisma } from "@/lib/prisma";
import { DAMAGE_PER_DOSSIER_BP } from "@/lib/dossiers";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetName = String(body?.targetName || "").trim();
    const count = Math.floor(Number(body?.count));
    if (!targetName || !Number.isFinite(count) || count <= 0) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, dossiers: true, eliminatedAt: true },
    });
    if (!me) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    if (me.eliminatedAt) return NextResponse.json({ error: "ELIMINATED" }, { status: 423 });

    const target = await prisma.user.findFirst({
      where: { name: targetName },
      select: { id: true, name: true, hpBP: true, eliminatedAt: true },
    });
    if (!target) return NextResponse.json({ error: "TARGET_NOT_FOUND" }, { status: 404 });
    if (target.id === me.id) return NextResponse.json({ error: "CANT_TARGET_SELF" }, { status: 400 });
    if (target.eliminatedAt) return NextResponse.json({ error: "TARGET_ALREADY_ELIMINATED" }, { status: 409 });

    // ✅ Vereis een afgerond onderzoek dat nog niet geconsumeerd is
    const readyInvestigation = await prisma.investigation.findFirst({
      where: {
        attackerId: me.id,
        targetId: target.id,
        completedAt: { not: null },
        consumedAt: null,
      },
      orderBy: { completedAt: "desc" },
      select: { id: true },
    });

    if (!readyInvestigation) {
      return NextResponse.json({ error: "INVESTIGATION_REQUIRED" }, { status: 403 });
    }

    // Genoeg dossiers?
    if ((me.dossiers ?? 0) < count) {
      return NextResponse.json({ error: "INSUFFICIENT_DOSSIERS" }, { status: 400 });
    }

    const damageBP = count * DAMAGE_PER_DOSSIER_BP;
    const now = new Date();

    // transact: consumeer het onderzoek, trek dossiers af, pas target HP aan
    await prisma.$transaction(async (tx) => {
      // 1) markeer dit onderzoek als verbruikt
      await tx.investigation.update({
        where: { id: readyInvestigation.id },
        data: { consumedAt: now },
      });

      // 2) trek dossiers af bij aanvaller
      await tx.user.update({
        where: { id: me.id },
        data: { dossiers: { decrement: count } },
      });

      // 3) verlaag HP bij target (kan elimineren)
      const cur = await tx.user.findUnique({
        where: { id: target.id },
        select: { hpBP: true },
      });
      if (!cur) throw new Error("TARGET_GONE");

      const newHP = Math.max(0, (cur.hpBP ?? 0) - damageBP);
      await tx.user.update({
        where: { id: target.id },
        data: {
          hpBP: newHP,
          eliminatedAt: newHP === 0 ? now : null,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      target: target.name,
      used: count,
      damageBP,
    });
  } catch (e: any) {
    console.error("use dossiers error:", e);
    return NextResponse.json(
      { error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
