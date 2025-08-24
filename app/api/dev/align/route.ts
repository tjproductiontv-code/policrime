// app/api/dev/align/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const HOUR = 3_600_000;
const floorToHour = (d: Date) => new Date(Math.floor(d.getTime() / HOUR) * HOUR);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? session?.user?.email ?? "";
  if (!email) return NextResponse.json({ error: "No email" }, { status: 401 });

  const nowFloor = floorToHour(new Date());
  const before = await prisma.user.findUnique({ where: { email }, select: { lastPassiveAt: true } });

  await prisma.user.update({ where: { email }, data: { lastPassiveAt: nowFloor } });

  const after = await prisma.user.findUnique({ where: { email }, select: { lastPassiveAt: true } });
  return NextResponse.json({
    ok: true,
    email,
    before: before?.lastPassiveAt?.toISOString() ?? null,
    after: after?.lastPassiveAt?.toISOString() ?? null,
  });
}
