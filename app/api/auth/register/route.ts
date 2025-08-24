// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { email, name, passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("REGISTER ERROR", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
