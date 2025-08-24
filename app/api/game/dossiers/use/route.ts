// app/api/game/dossiers/use/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";

/** hoeveel hpBP (percentagepunten) verlies per gebruikt dossier */
const HPBP_LOSS_PER_DOSSIER = 1;

/** tijdelijk debuggen (zet terug op false zodra het werkt) */
const DEBUG = true;

type Body = { targetId?: number | string; quantity?: number | string };

function parsePositiveInt(v: unknown) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function readBody(req: Request): Promise<Body> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await req.json().catch(() => ({}))) as Body;
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    return {
      targetId: (fd.get("targetId") ?? fd.get("target") ?? "") as any,
      quantity: (fd.get("quantity") ?? fd.get("count") ?? fd.get("aantal") ?? 1) as any,
    };
  }
  return (await req.json().catch(() => ({}))) as Body;
}

export async function POST(req: Request) {
  const dbg: Record<string, any> = { step: "start" };

  try {
    const me = await getUserFromCookie();
    if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    dbg.me = me.id;

    const body = await readBody(req);
    dbg.body = body;

    const targetIdNum = Number(body.targetId);
    const qtyWanted = parsePositiveInt(body.quantity);
    dbg.parsed = { targetIdNum, qtyWanted };

    if (!Number.isFinite(targetIdNum) || targetIdNum <= 0) {
      return NextResponse.json({ error: "INVALID_TARGET" }, { status: 400 });
    }
    if (targetIdNum === me.id) {
      return NextResponse.json({ error: "CANNOT_TARGET_SELF" }, { status: 400 });
    }
    if (qtyWanted <= 0) {
      return NextResponse.json({ error: "INVALID_QUANTITY" }, { status: 400 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      dbg.step = "fetchTarget";
      const target = await tx.user.findUnique({
        where: { id: targetIdNum },
        select: { id: true, hpBP: true }, // 👈 JUISTE veldnaam
      });
      if (!target) return { ok: false as const, reason: "TARGET_NOT_FOUND" };
      dbg.target = { id: target.id, hpBP: target.hpBP };

      dbg.step = "fetchAttacker";
      const attacker = await tx.user.findUnique({
        where: { id: me.id },
        select: { dossiers: true },
      });
      const have = attacker?.dossiers ?? 0;
      dbg.have = have;

      if (have < qtyWanted) {
        return {
          ok: false as const,
          reason: "INSUFFICIENT_DOSSIERS",
          have,
          needed: qtyWanted,
        };
      }

      dbg.step = "findEligible";
      const eligible = await tx.investigation.findFirst({
        where: {
          attackerId: me.id,
          targetId: targetIdNum,
          completedAt: { not: null },
          consumedAt: null,
        },
        select: { id: true },
      });
      dbg.eligible = eligible?.id ?? null;
      if (!eligible) return { ok: false as const, reason: "NO_ELIGIBLE_INVESTIGATION" };

      dbg.step = "decrementDossiers";
      const attackerAfter = await tx.user.update({
        where: { id: me.id },
        data: { dossiers: { decrement: qtyWanted } },
        select: { dossiers: true },
      });
      dbg.attackerAfter = attackerAfter.dossiers;

      dbg.step = "consumeInvestigation";
      try {
        await tx.investigation.update({
          where: { id: eligible.id },
          data: { consumedAt: now },
        });
      } catch (e: any) {
        if (e?.code === "P2025") {
          return { ok: false as const, reason: "CONFLICT_RETRY" };
        }
        throw e;
      }

      dbg.step = "updateHPBP";
      const oldHPBP = Math.max(0, Math.min(100, Math.round(target.hpBP ?? 100)));
      const loss = qtyWanted * HPBP_LOSS_PER_DOSSIER;
      const newHPBP = Math.max(0, oldHPBP - loss);
      dbg.hpBP = { oldHPBP, loss, newHPBP };

      await tx.user.update({
        where: { id: targetIdNum },
        data: { hpBP: newHPBP }, // 👈 update hpBP
      });

      const eliminated = newHPBP === 0;

      dbg.step = "done";
      return {
        ok: true as const,
        dossiersLeft: attackerAfter.dossiers,
        targetHPBP: newHPBP,
        eliminated,
      };
    });

    if (!result.ok) {
      if (DEBUG) return NextResponse.json({ ...result, _debug: dbg }, { status: 409 });
      switch (result.reason) {
        case "TARGET_NOT_FOUND":
          return NextResponse.json({ error: "TARGET_NOT_FOUND" }, { status: 404 });
        case "INSUFFICIENT_DOSSIERS":
          return NextResponse.json(
            { error: "INSUFFICIENT_DOSSIERS", have: (result as any).have, needed: (result as any).needed },
            { status: 400 }
          );
        case "NO_ELIGIBLE_INVESTIGATION":
          return NextResponse.json({ error: "NO_ELIGIBLE_INVESTIGATION" }, { status: 400 });
        case "CONFLICT_RETRY":
          return NextResponse.json({ error: "CONFLICT_RETRY" }, { status: 409 });
        default:
          return NextResponse.json({ error: "USE_FAILED" }, { status: 400 });
      }
    }

    return NextResponse.json(DEBUG ? { ...result, _debug: dbg } : result);
  } catch (err: any) {
    console.error("dossiers/use error:", err);
    if (DEBUG) {
      return NextResponse.json(
        { error: "Internal error", message: String(err?.message ?? err), _debug: { ...dbg, caught: true } },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
