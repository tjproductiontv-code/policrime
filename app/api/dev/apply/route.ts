// app/api/dev/apply/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getUserFromCookie(); // ✅ await toegevoegd

  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // Hier verder jouw logica...
  return NextResponse.json({ ok: true, userId: me.id });
}
