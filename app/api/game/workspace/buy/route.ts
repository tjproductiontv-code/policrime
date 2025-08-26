import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";
import { WORKSPACE_UNIT_PRICE } from "../../../../../lib/personnel";

function parseQty(v: unknown, min = 1, max = 9999) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

export async function POST(req: Request) {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const qty = parseQty(body?.quantity ?? body?.count ?? 1);
  const cost = qty * WORKSPACE_UNIT_PRICE;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, workspaceUnits: true },
  });
  if (!user) return NextResponse.json({ error: "UserNotFound" }, { status: 404 });

  if ((user.money ?? 0) < cost) {
    return NextResponse.json(
      { error: "INSUFFICIENT_FUNDS", have: user.money ?? 0, cost },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      money: { decrement: cost },
      workspaceUnits: { increment: qty },
    },
    select: { money: true, workspaceUnits: true },
  });

  return NextResponse.json({ ok: true, money: updated.money, workspaceUnits: updated.workspaceUnits });
}
