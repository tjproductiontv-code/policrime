// lib/auth.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "polipower_token";

type AuthTokenPayload = { id: number };

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET ontbreekt");
  return s;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function getUserFromCookie(): { id: number } | null {
  const c = cookies().get(COOKIE_NAME);
  if (!c?.value) return null;

  try {
    const decoded = jwt.verify(c.value, getSecret()) as JwtPayload | string;
    if (typeof decoded === "string") return null;
    const id = decoded.id as unknown;
    if (typeof id === "number") return { id };
    return null;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string): void {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
  });
}

export function clearAuthCookie(): void {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
