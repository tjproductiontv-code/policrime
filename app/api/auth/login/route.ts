// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { setAuthCookie, signToken } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    { status: 405, headers: { "Content-Type": "application/json", "Allow": "POST" } }
  );
}

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "").toLowerCase().trim();
  const password = String(form.get("password") || "");

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail en wachtwoord verplicht" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Onjuiste inloggegevens" }, { status: 400 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Onjuiste inloggegevens" }, { status: 400 });
  }

  const token = signToken({ id: user.id });
  setAuthCookie(token);

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
