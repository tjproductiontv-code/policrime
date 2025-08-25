import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../../lib/auth";
import { VOTE_PRICE } from "../../../../../../lib/game";
import { randomDiscountBps } from "../../../../../../lib/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key: "anika" } },
    select: { level: true, discountBps: true, discountValidUntil: true, progressBps: true },
  });

  if (!uc || uc.level < 1) {
    return NextResponse.json({
      ok: true,
      unlocked: false,
      level: uc?.level ?? 0,
      progressBps: uc?.progressBps ?? 0,
    });
  }

  const now = Date.now();
  const needsRefresh = !uc.discountValidUntil || uc.discountValidUntil.getTime() <= now;

  let discountBps = uc.discountBps;
  let validUntil = uc.discountValidUntil;

  if (needsRefresh) {
    discountBps = randomDiscountBps(uc.level);
    validUntil = new Date(now + 30 * 60 * 1000);
    await prisma.userConnection.update({
      where: { userId_key: { userId: me.id, key: "anika" } },
      data: { discountBps, discountValidUntil: validUntil },
    });
  }

  const price = Math.max(1, Math.floor((VOTE_PRICE * discountBps) / 10000));

  return NextResponse.json({
    ok: true,
    unlocked: true,
    level: uc.level,
    discountBps,
    price,
    validUntil: validUntil?.toISOString() ?? null,
  });
}
