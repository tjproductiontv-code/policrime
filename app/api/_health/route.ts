// app/api/_health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ping de database
    await prisma.$queryRaw`SELECT 1`;

    // ✅ Await nodig hier!
    const me = await getUserFromCookie();

    return NextResponse.json({
      ok: true,
      db: "up",
      auth: Boolean(me?.id),
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("health error:", err);
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
