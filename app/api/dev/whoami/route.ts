// app/api/dev/whoami/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { email: true, lastPassiveAt: true, passivePerHour: true, money: true },
  });

  return NextResponse.json({
    sessionEmail: session.user.email,
    user,
    iso: user?.lastPassiveAt?.toISOString() ?? null,
  });
}
