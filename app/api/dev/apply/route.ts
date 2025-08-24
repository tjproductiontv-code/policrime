// app/api/dev/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { applyPassiveIncome } from "@/lib/applyPassiveIncome";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await applyPassiveIncome(session.user.email);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { money: true, passivePerHour: true, lastPassiveAt: true, email: true },
  });

  return NextResponse.json({ user });
}
