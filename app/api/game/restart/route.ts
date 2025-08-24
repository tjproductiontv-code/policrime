// app/api/game/restart/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// helper om af te ronden naar vorige hele uur
function floorToHour(d: Date): Date {
  const x = new Date(d);
  x.setMinutes(0, 0, 0);
  return x;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, votes: true, passivePerHour: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

    // ✅ stemmen –1000, min. 0
    const newVotes = Math.max(0, (user.votes ?? 0) - 1000);

    // ✅ passief inkomen –10%
    const basePerHour = user.passivePerHour ?? 0;
    const newPassivePerHour = Math.floor(basePerHour * 0.9);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        // voortgang reset
        level: 1,
        levelProgress: 0,
        money: 50,

        // stemmen en passief inkomen
        votes: newVotes,
        passivePerHour: newPassivePerHour,
        lastPassiveAt: floorToHour(new Date()), // 🔑 netjes op heel uur

        // status
        hpBP: 10000,        // volle HP
        eliminatedAt: null,

        // timers resetten
        lastNepfactuurAt: null,
        lastVriendjeAt: null,
        investigationUntil: null,

        // optioneel: dossiers reset
        dossiers: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      votes: newVotes,
      passivePerHourBefore: basePerHour,
      passivePerHourAfter: newPassivePerHour,
    });
  } catch (e: any) {
    console.error("restart error:", e);
    return NextResponse.json(
      { error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
