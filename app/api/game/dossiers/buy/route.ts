// app/api/game/dossiers/buy/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromCookie } from "../../../../../lib/auth";

const DOSSIER_PRICE = 10;

async function readQuantity(req: Request): Promise<{ qty: number; raw: any; ct: string }> {
  const ct = req.headers.get("content-type") || "";
  let raw: unknown = 1;

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    raw = (body as any)?.quantity ?? (body as any)?.count ?? (body as any)?.aantal ?? 1;
  } else if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    raw = fd.get("quantity") ?? fd.get("count") ?? fd.get("aantal") ?? 1;
  } else {
    // fallback: probeer JSON voor clients zonder content-type
    const body = await req.json().catch(() => ({}));
    raw = (body as any)?.quantity ?? (body as any)?.count ?? (body as any)?.aantal ?? 1;
  }

  const n = Number.parseInt(String(raw), 10);
  const qty = Number.isFinite(n) && n > 0 ? Math.min(n, 999) : 1;
  return { qty, raw, ct };
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { qty: quantity, raw, ct } = await readQuantity(req);
    console.log("dossiers/buy", { ct, rawQuantity: raw, parsedQuantity: quantity });

    const totalCost = quantity * DOSSIER_PRICE;

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true, money: true, dossiers: true },
      });
      if (!current) throw new Error("UserNotFound");
      if ((current.money ?? 0) < totalCost) {
        return { ok: false as const, reason: "INSUFFICIENT_FUNDS", money: current.money, needed: totalCost };
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          money: { decrement: totalCost },
          dossiers: { set: (current.dossiers ?? 0) + quantity }, // 🔒 set i.p.v. increment
        },
        select: { money: true, dossiers: true },
      });

      return { ok: true as const, updated, current };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Insufficient funds", money: result.money, needed: result.needed, debug: { contentType: ct, raw } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      price: DOSSIER_PRICE,
      quantity,               // 👈 zie hier wat de server denkt dat je kocht
      totalCost,
      money: result.updated.money,
      dossiers: result.updated.dossiers,
      debug: { contentType: ct, rawQuantity: raw }, // 👈 debug terug naar client
    });
  } catch (err: any) {
    if (err?.message === "UserNotFound") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("dossiers/buy error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
