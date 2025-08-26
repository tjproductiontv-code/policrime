// app/api/actions/propaganda/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getUserFromCookie(); // ✅ await toegevoegd
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // haal kosten uit body of gebruik default 5
  const body = await req.json().catch(() => ({} as any));
  const cost = Number.isFinite(Number(body?.cost)) ? Number(body.cost) : 5;

  // haal saldo op
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, money: true },
  });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // te weinig geld? redirect naar out-of-funds
  const geld = user.money ?? 0;
  if (geld < cost) {
    return NextResponse.redirect(new URL("/out-of-funds", req.url), 303);
  }

  // betaal & log actie
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { money: { decrement: cost } },
    }),
    prisma.actionLog.create({
      data: { userId: user.id, type: "PROPAGANDA", cost, influenceChange: 0 },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
