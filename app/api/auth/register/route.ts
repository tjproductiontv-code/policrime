// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signToken, setAuthCookie } from "../../../../lib/auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// (optioneel) blokkeer GET
export function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(req: Request) {
  try {
    let name = "";
    let email = "";
    let password = "";

    const ct = req.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any));
      name = String(body?.name ?? "").trim();
      email = String(body?.email ?? "").toLowerCase().trim();
      password = String(body?.password ?? "");
    } else {
      const form = await req.formData().catch(() => null);
      if (form) {
        name = String(form.get("name") ?? "").trim();
        email = String(form.get("email") ?? "").toLowerCase().trim();
        password = String(form.get("password") ?? "");
      }
    }

    if (!name || !isEmail(email) || password.length < 6) {
      return NextResponse.json(
        { error: "INVALID_INPUT", detail: "Naam, geldig e-mailadres en wachtwoord (≥6) vereist." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });

    const token = signToken({ id: user.id }); // vereist JWT_SECRET
    setAuthCookie(token);

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "EMAIL_IN_USE", detail: "Dit e-mailadres is al geregistreerd." },
        { status: 409 }
      );
    }
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
