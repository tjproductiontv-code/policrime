// app/api/auth/login/route.ts (bijvoorbeeld)

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const COOKIE_NAME = "auth_token";
const MAX_AGE_SECONDS = 60 * 5; // 5 minuten

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function parseBody(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await req.json();
  }

  const form = await req.formData();
  return {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
}

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req);
    const { email, password } = LoginSchema.parse(parsed);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // ✅ Belangrijk: secure cookie alleen op productie
    const isProd = process.env.NODE_ENV === "production";

    cookies().set(COOKIE_NAME, String(user.id), {
      httpOnly: true,
      secure: isProd,        // ← DIT is cruciaal!
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });

    // HTML redirect voor formulier-submits
    const accept = req.headers.get("accept") || "";
    const contentType = req.headers.get("content-type") || "";
    const isHtml = accept.includes("text/html");
    const isForm =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    if (isHtml || isForm) {
      return NextResponse.redirect(new URL("/dashboard", req.url), 303);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "BAD_REQUEST", issues: err.flatten() }, { status: 400 });
    }
    console.error("Login error:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
