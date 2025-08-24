// app/api/game/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { TEN_MIN, FOURTEEN_MIN } from "@/lib/game";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      lastNepfactuurAt: true,
      lastVriendjeAt: true,
      investigationUntil: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // bereken absolute eindtijden
  const nepfactuurReadyAt = user.lastNepfactuurAt
    ? new Date(user.lastNepfactuurAt.getTime() + TEN_MIN * 1000).toISOString()
    : null;

  const vriendjeReadyAt = user.lastVriendjeAt
    ? new Date(user.lastVriendjeAt.getTime() + FOURTEEN_MIN * 1000).toISOString()
    : null;

  const investigationUntil = user.investigationUntil
    ? user.investigationUntil.toISOString()
    : null;

  return NextResponse.json({
    investigationUntil,
    readyAt: {
      nepfactuur: nepfactuurReadyAt,
      vriendje: vriendjeReadyAt,
    },
  });
}
