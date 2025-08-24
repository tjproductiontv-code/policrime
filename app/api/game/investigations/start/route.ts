// app/api/game/investigations/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";
import {
  minInvestigatorsForRank,
  computeInvestigationETA,
} from "../../../../../lib/investigations";

type Body = {
  targetId?: number | string;
  assigned?: number | string;
};

function parseIntClamp(v: unknown, min = 1, max = 999) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

async function readBody(req: Request): Promise<Body> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Body;
  }
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    return {
      targetId: (fd.get("targetId") ?? fd.get("target") ?? "") as any,
      assigned: (fd.get("assigned") ?? fd.get("count") ?? fd.get("quantity") ?? 1) as any,
    };
  }
  // fallback
  return (await req.json().catch(() => ({}))) as Body;
}

export async function POST(req: Request) {
  try {
    const me = await getUserFromCookie();
    if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await readBody(req);
    const assigned = parseIntClamp(body.assigned, 1, 999);

    // targetId als getal (Prisma Int)
    const targetIdNum = Number(body.targetId);
    if (!Number.isFinite(targetIdNum) || targetIdNum <= 0) {
      return NextResponse.json({ error: "INVALID_TARGET" }, { status: 400 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // ❌ geen dubbele lopende onderzoeken op hetzelfde target
      const existing = await tx.investigation.findFirst({
        where: { attackerId: me.id, targetId: targetIdNum, completedAt: null },
        select: { id: true },
      });
      if (existing) {
        return { ok: false as const, reason: "ALREADY_RUNNING", existingId: existing.id };
      }

      // Target level nodig voor min-per-rank & ETA
      const target = await tx.user.findUnique({
        where: { id: targetIdNum },
        select: { id: true, level: true },
      });
      if (!target) {
        return { ok: false as const, reason: "TARGET_NOT_FOUND" };
      }
      const targetLevel = Number(target.level ?? 1) || 1;

      // Min per rank
      const minReq = minInvestigatorsForRank(targetLevel);
      if (assigned < minReq) {
        return { ok: false as const, reason: "MIN_PER_RANK", minRequired: minReq };
      }

      // Beschikbaar (idle) genoeg?
      const u = await tx.user.findUnique({
        where: { id: me.id },
        select: { investigators: true, investigatorsBusy: true },
      });
      if (!u) throw new Error("UserNotFound");

      const idle = u.investigators ?? 0;
      if (idle < assigned) {
        return { ok: false as const, reason: "NOT_ENOUGH_IDLE", idle, needed: assigned };
      }

      // Verbruik nu: idle ↓, busy ↑
      await tx.user.update({
        where: { id: me.id },
        data: {
          investigators: { decrement: assigned },     // definitief verbruikt
          investigatorsBusy: { increment: assigned }, // informatieteller
        },
      });

      // Echte ETA (random basis + rank + reductie per extra)
      const etaAt = computeInvestigationETA(assigned, targetLevel, now);

      // Start het onderzoek
      const inv = await tx.investigation.create({
        data: {
          attackerId: me.id,
          targetId: targetIdNum,
          assigned,
          startedAt: now,
          etaAt,
        },
        select: {
          id: true,
          targetId: true,
          assigned: true,
          startedAt: true,
          etaAt: true,
        },
      });

      return { ok: true as const, inv, minReq };
    });

    if (!result.ok) {
      switch (result.reason) {
        case "ALREADY_RUNNING":
          return NextResponse.json(
            { error: "ALREADY_RUNNING", existingId: result.existingId },
            { status: 400 }
          );
        case "TARGET_NOT_FOUND":
          return NextResponse.json({ error: "TARGET_NOT_FOUND" }, { status: 404 });
        case "MIN_PER_RANK":
          return NextResponse.json(
            { error: "MIN_PER_RANK", minRequired: result.minRequired },
            { status: 400 }
          );
        case "NOT_ENOUGH_IDLE":
          return NextResponse.json(
            { error: "NOT_ENOUGH_IDLE", idle: result.idle, needed: result.needed },
            { status: 400 }
          );
        default:
          return NextResponse.json({ error: "START_FAILED" }, { status: 400 });
      }
    }

    return NextResponse.json({
      ok: true,
      investigation: result.inv,
    });
  } catch (err: any) {
    if (err?.message === "UserNotFound") {
      return NextResponse.json({ error: "UserNotFound" }, { status: 404 });
    }
    console.error("investigations/start error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
