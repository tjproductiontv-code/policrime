// app/api/game/level/add-progress/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route"; // laat deze staan als dit jouw pad is
import { prisma } from "@/lib/prisma";
import { addProgress } from "@/lib/leveling";
import { LEVELS } from "@/lib/levels";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // amount mag number of string zijn; fallback = 5
  const body = await req.json().catch(() => ({} as any));
  const parsed = Number(body?.amount);
  const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // ✅ werkt met Float + carry-over tot level-up
  const updated = await addProgress(user.id, amount);

  // Rangtitel erbij is handig voor UI
  const levelInfo = LEVELS[updated.level] ?? { title: "Onbekend", description: "" };

  return NextResponse.json({
    ok: true,
    amountAdded: Number(amount.toFixed(2)),
    level: updated.level,
    levelProgress: Number(updated.levelProgress.toFixed(2)), // 2 decimalen
    rankTitle: levelInfo.title,
    rankDescription: levelInfo.description,
  });
}
