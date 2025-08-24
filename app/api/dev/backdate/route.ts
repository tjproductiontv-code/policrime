import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const h = Number(searchParams.get("h") ?? "3"); // default 3 uur
  if (!Number.isFinite(h) || h <= 0) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }

  const backdate = new Date(Date.now() - h * 3_600_000);

  await prisma.user.update({
    where: { email: session.user.email },
    data: { lastPassiveAt: backdate },
  });

  return NextResponse.json({ ok: true, backdatedHours: h });
}
