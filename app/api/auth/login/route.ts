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

// ✅ Hulpfunctie om JSON of FormData te ondersteunen
async function parseBody(req: Request): Promise<z.infer<typeof LoginSchema>> {
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

    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // ✅ Zet cookie
    cookies().set(COOKIE_NAME, String(user.id), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });

    // ✅ Check of browser HTML verwacht (form / redirect)
    const accept = req.headers.get("accept") || "";
    const contentType = req.headers.get("content-type") || "";
    const isForm =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    const wantsHtml = accept.includes("text/html") || isForm;
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/dashboard", req.url), 303);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "BAD_REQUEST", issues: err.flatten() },
        { status: 400 }
      );
    }

    console.error("Login error:", err?.message || err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
