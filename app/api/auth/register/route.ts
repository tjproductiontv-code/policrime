// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signToken, setAuthCookie } from "../../../../lib/auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// (optioneel) voorkom GET rechtstreeks op deze route
export function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(req: Request) {
  try {
    // ondersteunt <form method="POST"> met enctype default (form-urlencoded)
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").toLowerCase().trim();
    const password = String(form.get("password") ?? "");

    // basisvalidatie
    if (!name || !email || !email.includes("@") || password.length < 6) {
      return NextResponse.json(
        { error: "INVALID_INPUT", detail: "Naam, geldig e-mailadres en wachtwoord (≥6) vereist." },
        { status: 400 }
      );
    }

    // hash wachtwoord
    const passwordHash = await bcrypt.hash(password, 10);

    // aanmaken; email is unique in schema
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    // JWT cookie zetten voor ingelogde sessie
    const token = signToken({ id: user.id });
    setAuthCookie(token);

    // naar dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err: any) {
    // Prisma: unieke constraint (email bestaat al)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "EMAIL_IN_USE", detail: "Dit e-mailadres is al geregistreerd." },
        { status: 409 }
      );
    }

    // JWT_SECRET ontbreekt → signToken gooit error
    if (String(err?.message ?? "").includes("JWT_SECRET")) {
      return NextResponse.json(
        { error: "JWT_MISCONFIGURED", detail: "JWT_SECRET ontbreekt in environment." },
        { status: 500 }
      );
    }

    console.error("register error:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
