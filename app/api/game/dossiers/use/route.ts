// app/api/game/dossiers/use/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";

function parseIntClamp(v: unknown, min = 1, max = 999) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

async function readBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await req.json().catch(() => ({}))) as any;
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    return {
      targetId: fd.get("targetId"),
      quantity: fd.get("quantity") ?? fd.get("count") ?? fd.get("aantal"),
    } as any;
  }
  return (await req.json().catch(() => ({}))) as any;
}

export async function POST(req: Request) {
  try {
    const me = await getUserFromCookie();
    if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await readBody(req);
    const targetIdNum = Number(body?.targetId);
    if (!Number.isFinite(targetIdNum) || targetIdNum <= 0) {
      return NextResponse.json({ error: "INVALID_TARGET" }, { status: 400 });
    }

    const quantity = parseIntClamp(body?.quantity ?? body?.count ?? body?.aantal ?? 1, 1, 999);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: me.id },
        select: { dossiers: true },
      });
      if (!user) throw new Error("UserNotFound");

      const haveDossiers = user.dossiers ?? 0;
      if (haveDossiers < quantity) {
        return { ok: false as const, reason: "INSUFFICIENT_DOSSIERS", haveDossiers, needed: quantity };
      }

      // 🌟 Neem steeds de MEEST RECENTE afgeronde onderzoeken
      let eligible = await tx.investigation.findMany({
        where: {
          attackerId: me.id,
          targetId: targetIdNum,
          completedAt: { not: null },
          consumedAt: null,
        },
        orderBy: { completedAt: "desc" }, // 👈 nieuwste eerst
        select: { id: true },
        take: quantity,
      });

      if (eligible.length < quantity) {
        return {
          ok: false as const,
          reason: "NO_ELIGIBLE_INVESTIGATIONS",
          haveEligible: eligible.length,
          needed: quantity,
        };
      }

      const ids = eligible.map((e) => e.id);

      const upd = await tx.investigation.updateMany({
        where: { id: { in: ids }, consumedAt: null },
        data: { consumedAt: now },
      });
      if (upd.count !== quantity) throw new Error("RaceCondition");

      const updatedUser = await tx.user.update({
        where: { id: me.id },
        data: { dossiers: { decrement: quantity } },
        select: { dossiers: true },
      });

      return { ok: true as const, used: quantity, remainingDossiers: updatedUser.dossiers, consumedIds: ids };
    });

    if (!result.ok) {
      if (result.reason === "INSUFFICIENT_DOSSIERS") {
        return NextResponse.json(
          { error: "INSUFFICIENT_DOSSIERS", have: result.haveDossiers, needed: result.needed },
          { status: 400 }
        );
      }
      if (result.reason === "NO_ELIGIBLE_INVESTIGATIONS") {
        return NextResponse.json(
          { error: "NO_ELIGIBLE_INVESTIGATION", haveEligible: result.haveEligible, needed: result.needed },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "USE_FAILED" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      used: result.used,
      consumedIds: result.consumedIds, // 👈 handig voor debugging/telemetry
      dossiersLeft: result.remainingDossiers,
    });
  } catch (e: any) {
    if (e?.message === "UserNotFound") return NextResponse.json({ error: "UserNotFound" }, { status: 404 });
    if (e?.message === "RaceCondition") return NextResponse.json({ error: "CONFLICT_RETRY" }, { status: 409 });
    console.error("dossiers/use error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
