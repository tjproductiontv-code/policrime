// app/api/dev/whoami/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = getUserFromCookie(); // { id } | null
  if (!me?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, email: true, name: true }
  });

  return NextResponse.json({ ok: true, me: user });
}
