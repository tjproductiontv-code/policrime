import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const COOKIE_NAME = "auth_token";
const FIVE_MIN = 60 * 5;

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ✅ Helper om zowel JSON als FormData te lezen
async function readBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }
  const fd = await req.formData().catch(() => null);
  if (!fd) return {};
  return {
    email: fd.get("email")?.toString(),
    password: fd.get("password")?.toString(),
  };
}

export async function POST(req: Request) {
  try {
    const raw = await readBody(req);
    const { email, password } = Schema.parse(raw);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const token = String(user.id);
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: FIVE_MIN, // 5 min inactivity
    });

    // ✅ Redirect bij HTML of formulier-verzoek
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
      return NextResponse.json({ error: "BAD_REQUEST", details: err.flatten() }, { status: 400 });
    }
    console.error("login error:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
