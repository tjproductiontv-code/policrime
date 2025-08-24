import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PRIVILEGE_CATALOG } from "@/lib/privileges";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const key = String(body?.key || "");
    const item = PRIVILEGE_CATALOG.find((p) => p.key === key);
    if (!item) {
      return NextResponse.json({ error: "UNKNOWN_PRIVILEGE" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, votes: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

    const owned = await prisma.userPrivilege.findFirst({
      where: { userId: user.id, key },
      select: { id: true },
    });
    if (owned) {
      return NextResponse.json({ error: "ALREADY_OWNED" }, { status: 409 });
    }

    if ((user.votes ?? 0) < item.costVotes) {
      return NextResponse.json({ error: "INSUFFICIENT_VOTES", need: item.costVotes }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          votes: { decrement: item.costVotes },            // stemmen afboeken
          passivePerHour: { increment: item.incomePerHour } // €/uur verhogen
        },
      }),
      prisma.userPrivilege.create({ data: { userId: user.id, key } }),
    ]);

    return NextResponse.json({ ok: true, key, spentVotes: item.costVotes, addedPerHour: item.incomePerHour });
  } catch (err: any) {
    console.error("buy privilege error:", err);
    return NextResponse.json({ error: "SERVER_ERROR", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
