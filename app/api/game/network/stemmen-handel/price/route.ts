import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../../lib/auth";
import { VOTE_PRICE } from "../../../../../../lib/game";
import { randomDiscountBps } from "../../../../../../lib/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key: "anika" } },
    select: {
      level: true,
      progressBps: true,
      discountBps: true,
      discountValidUntil: true,
    },
  });

  // Niet vrijgespeeld -> meld locked + level/progress
  if (!uc || uc.level < 1) {
    return NextResponse.json({
      ok: true,
      unlocked: false,
      level: uc?.level ?? 0,
      progressBps: uc?.progressBps ?? 0,
    });
  }

  const now = Date.now();
  const isExpired =
    !uc.discountValidUntil || uc.discountValidUntil.getTime() <= now;

  let discountBps = uc.discountBps ?? null;
  let validUntil = uc.discountValidUntil ?? null;

  // Als er (nog) geen discount staat of hij is verlopen: refresh op basis van level
  if (isExpired || discountBps == null) {
    const freshBps = randomDiscountBps(uc.level); // bv. 75–90% op L1, 60–80% op L2
    const freshUntil = new Date(now + 30 * 60 * 1000); // 30 min geldig

    await prisma.userConnection.update({
      where: { userId_key: { userId: me.id, key: "anika" } },
      data: { discountBps: freshBps, discountValidUntil: freshUntil },
    });

    discountBps = freshBps;
    validUntil = freshUntil;
  }

  // Extra vangnet: als het om wat voor reden alsnog null is, gebruik 100% (geen korting)
  const safeBps = typeof discountBps === "number" ? discountBps : 10000;

  // Prijs in hele euro's, min 1
  const price = Math.max(1, Math.floor((VOTE_PRICE * safeBps) / 10000));

  return NextResponse.json({
    ok: true,
    unlocked: true,
    level: uc.level,
    discountBps: safeBps,
    price,
    validUntil: validUntil ? validUntil.toISOString() : null,
  });
}
