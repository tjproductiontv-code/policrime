import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; // pad aanpassen indien nodig
import { prisma } from "@/lib/prisma"; // jouw prisma import

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const { amount } = await request.json();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, money: true },
    });
    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (user.money < amount) {
      // Belangrijk: GEEN server redirect hier als je via fetch post
      return NextResponse.json({ error: "INSUFFICIENT_FUNDS" }, { status: 402 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { money: { decrement: amount } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "UNKNOWN_ERROR" }, { status: 500 });
  }
}
