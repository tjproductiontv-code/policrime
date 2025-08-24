// app/api/dev/align/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const HOUR = 3_600_000;
const floorToHour = (d: Date) => new Date(Math.floor(d.getTime() / HOUR) * HOUR);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const emailParam = url.searchParams.get("email");
  const cookieUser = getUserFromCookie(); // { id:number } | null

  let userId: number | null = cookieUser?.id ?? null;
  let email: string | null = emailParam ?? null;

  if (!userId && email) {
    const found = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (found) userId = found.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowFloor = floorToHour(new Date());

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastPassiveAt: true, email: true },
  });

  await prisma.user.update({ where: { id: userId }, data: { lastPassiveAt: nowFloor } });

  const after = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastPassiveAt: true, email: true },
  });

  email = after?.email ?? before?.email ?? email;

  return NextResponse.json({
    ok: true,
    userId,
    email,
    before: before?.lastPassiveAt?.toISOString() ?? null,
    after: after?.lastPassiveAt?.toISOString() ?? null,
  });
}
