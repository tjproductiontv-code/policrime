// app/api/_debug/me/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromCookie } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers: NO_STORE });
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, money: true, votes: true, dossiers: true, level: true, levelProgress: true, hpBP: true, eliminatedAt: true }
  });
  return NextResponse.json({ ok: true, user }, { headers: NO_STORE });
}

const NO_STORE = { "Cache-Control": "no-store" };
