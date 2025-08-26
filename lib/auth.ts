// lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "auth_token";

export async function getUserFromCookie() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = Number(token);
  if (!Number.isFinite(userId)) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user ? { id: user.id } : null;
}

// ✅ Uitloggen
export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
}
