import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const users = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      session: Boolean(session?.user?.email),
      users,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
        NODE_ENV: process.env.NODE_ENV || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
