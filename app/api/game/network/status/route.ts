import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ ok: true, authed: false, unlocked: false, level: 0 });
  }

  // Haal connectie "anika" op (later kan je dit uitbreiden voor meerdere keys)
  const uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key: "anika" } },
    select: { level: true, progressBps: true },
  });

  const level = uc?.level ?? 0;
  const unlocked = level >= 1;

  return NextResponse.json({
    ok: true,
    authed: true,
    unlocked,
    level,
    progressBps: uc?.progressBps ?? 0,
  });
}
