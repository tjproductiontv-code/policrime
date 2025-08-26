// app/api/game/investigators/buy/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { INVESTIGATOR_PRICE } from "@/lib/investigations";

export const dynamic = "force-dynamic";

// (optioneel) blokkeer GET
export function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(req: Request) {
  try {
    const me = await getUserFromCookie(); // ✅ await toegevoegd
    if (!me?.id) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // JSON of FormData accepteren
    const body =
      (await req.json().catch(async () => {
        const f = await req.formData().catch(() => null);
        return f ? Object.fromEntries(f) : {};
      })) || {};

    const qtyRaw = Number((body as any).count ?? (body as any).qty ?? 1);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.floor(qtyRaw) : 1;

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { id: true, money: true, investigators: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

    const cost = qty * INVESTIGATOR_PRICE;
    if ((user.money ?? 0) < cost) {
      return NextResponse.json({ error: "INSUFFICIENT_FUNDS", need: cost }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        money: { decrement: cost },
        investigators: { increment: qty },
      },
      select: { money: true, investigators: true },
    });

    return NextResponse.json({ ok: true, qty, cost, ...updated });
  } catch (err) {
    console.error("investigators/buy error:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
