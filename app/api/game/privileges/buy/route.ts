// app/api/game/privileges/buy/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { PRIVILEGE_CATALOG } from "../../../../../lib/privileges";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // ✅ Auth via jouw JWT-cookie
    const me = getUserFromCookie(); // { id: number } | null
    if (!me?.id) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Body lezen
    const body = await req.json().catch(() => ({} as any));
    const key = String(body?.key || "");
    const item = PRIVILEGE_CATALOG.find((p) => p.key === key);
    if (!item) {
      return NextResponse.json({ error: "UNKNOWN_PRIVILEGE" }, { status: 400 });
    }

    // User + huidige votes
    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { id: true, votes: true },
    });
    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Al in bezit?
    const owned = await prisma.userPrivilege.findFirst({
      where: { userId: user.id, key },
      select: { id: true },
    });
    if (owned) {
      return NextResponse.json({ error: "ALREADY_OWNED" }, { status: 409 });
    }

    // Genoeg stemmen?
    if ((user.votes ?? 0) < item.costVotes) {
      return NextResponse.json(
        { error: "INSUFFICIENT_VOTES", need: item.costVotes },
        { status: 400 }
      );
    }

    // Transactie: stemmen afboeken, passief inkomen verhogen, privilege registreren
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          votes: { decrement: item.costVotes },
          passivePerHour: { increment: item.incomePerHour },
        },
      }),
      prisma.userPrivilege.create({ data: { userId: user.id, key } }),
    ]);

    return NextResponse.json({
      ok: true,
      key,
      spentVotes: item.costVotes,
      addedPerHour: item.incomePerHour,
    });
  } catch (err: any) {
    console.error("buy privilege error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
