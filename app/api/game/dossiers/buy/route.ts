// app/api/game/dossiers/buy/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";
import { DOSSIER_PRICE_EUR } from "../../../../../lib/dossiers";
import { dossierCapacity } from "../../../../../lib/personnel";

type Body = { quantity?: number | string };

function parsePositiveInt(v: unknown) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function readBody(req: Request): Promise<Body> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await req.json().catch(() => ({}))) as Body;
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    return { quantity: (fd.get("quantity") ?? fd.get("count") ?? fd.get("aantal") ?? 1) as any };
  }
  return (await req.json().catch(() => ({}))) as Body;
}

export async function POST(req: Request) {
  try {
    const me = await getUserFromCookie();
    if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await readBody(req);
    const qtyWanted = parsePositiveInt(body.quantity);
    if (qtyWanted <= 0) return NextResponse.json({ error: "INVALID_QUANTITY" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { money: true, dossiers: true, civilServants: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

    const price = DOSSIER_PRICE_EUR;
    const cap = dossierCapacity(user.civilServants ?? 0);
    const stock = user.dossiers ?? 0;
    const free = Math.max(0, cap - stock);

    if (free <= 0) {
      return NextResponse.json({ error: "CAPACITY_EXCEEDED", free }, { status: 400 });
    }
    if (qtyWanted > free) {
      return NextResponse.json({ error: "CAPACITY_EXCEEDED", free }, { status: 400 });
    }

    const cost = qtyWanted * price;
    const money = user.money ?? 0;
    if (cost > money) {
      return NextResponse.json({ error: "INSUFFICIENT_FUNDS", cost, money }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        money: { decrement: cost },
        dossiers: { increment: qtyWanted },
      },
      select: { money: true, dossiers: true },
    });

    return NextResponse.json({
      ok: true,
      bought: qtyWanted,
      money: updated.money,
      dossiers: updated.dossiers,
    });
  } catch (err) {
    console.error("dossiers/buy error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
