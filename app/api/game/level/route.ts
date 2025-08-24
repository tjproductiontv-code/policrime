import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/lib/levels";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const info = LEVELS[user.level] ?? { title: "Onbekend", description: "" };
  return NextResponse.json({ ...user, ...info });
}
