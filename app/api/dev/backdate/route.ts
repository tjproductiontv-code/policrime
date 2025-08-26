// app/api/dev/backdate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/dev/backdate?minutes=30
 * Opties (allemaal optioneel):
 *  - iso=2025-08-24T10:00:00.000Z  -> zet exact deze tijd
 *  - hours=2                       -> zet 2 uur terug
 *  - minutes=30                    -> zet 30 min terug
 *  - ms=900000                     -> zet 900.000 ms terug
 * Geen params? default: 1 uur terug.
 */
export async function POST(req: NextRequest) {
  const me = await getUserFromCookie(); // 👈 vergeet niet de await
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const iso = url.searchParams.get("iso");
  const hours = Number(url.searchParams.get("hours"));
  const minutes = Number(url.searchParams.get("minutes"));
  const ms = Number(url.searchParams.get("ms"));

  let target: Date | null = null;

  // Optie 1: exacte tijd
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      target = d;
    }
  }

  // Optie 2: relatieve tijd (alleen als target nog null is)
  if (!target) {
    const deltaMs =
      (Number.isFinite(ms) ? ms : 0) +
      (Number.isFinite(hours) ? hours * 3_600_000 : 0) +
      (Number.isFinite(minutes) ? minutes * 60_000 : 0);

    // default: 1 uur terug als er niets is opgegeven
    target = new Date(Date.now() - (deltaMs || 3_600_000));
  }

  const before = await prisma.user.findUnique({
    where: { id: me.id },
    select: { lastPassiveAt: true },
  });

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { lastPassiveAt: target },
    select: { lastPassiveAt: true },
  });

  return NextResponse.json({
    ok: true,
    before: before?.lastPassiveAt?.toISOString() ?? null,
    after: updated.lastPassiveAt?.toISOString() ?? null,
  });
}
