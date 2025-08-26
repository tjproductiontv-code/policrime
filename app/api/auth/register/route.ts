// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Configuratie
const COOKIE_NAME = "auth_token";
const FIVE_MIN = 60 * 5;

// Validatie-schema
const Schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

// ✅ Helper om JSON of FormData te lezen
async function readBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }
  const fd = await req.formData().catch(() => null);
  if (!fd) return {};
  return {
    email: fd.get("email")?.toString(),
    name: fd.get("name")?.toString(),
    password: fd.get("password")?.toString(),
  };
}

export async function POST(req: Request) {
  try {
    const raw = await readBody(req);

    // 🔎 Tijdelijke logging
    console.log("register payload:", raw);

    const data = {
      email: (raw.email as string | undefined)?.trim().toLowerCase(),
      name: (raw.name as string | undefined)?.trim(),
      password: (raw.password as string | undefined)?.toString(),
    };

    const { email, name, password } = Schema.parse(data);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        money: 50,
        level: 1,
        levelProgress: 0,
        hpBP: 10000,
      },
      select: { id: true },
    });

    const token = String(user.id);
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: FIVE_MIN,
    });

    // ✅ Redirect logica
    const accept = req.headers.get("accept") || "";
    const wantsHTML = accept.includes("text/html");
    const ct = req.headers.get("content-type") || "";
    const isForm =
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data");

    if (wantsHTML || isForm) {
      return NextResponse.redirect(new URL("/dashboard", req.url), 303);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "BAD_REQUEST", details: err.flatten() },
        { status: 400 }
      );
    }

    if (err?.code === "P2002") {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    console.error("register error:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
