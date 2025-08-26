// lib/auth.ts
import { headers } from "next/headers";
import { parse } from "cookie";
import { prisma } from "./prisma";

const COOKIE_NAME = "auth_token";

// Simpel token = userId (string)
function decodeToken(token: string): { userId: number } | null {
  const id = Number(token);
  return Number.isFinite(id) ? { userId: id } : null;
}

export async function getUserFromCookie() {
  const rawCookie = headers().get("cookie") || "";
  const cookies = parse(rawCookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true },
  });

  return user ? { id: user.id } : null;
}
