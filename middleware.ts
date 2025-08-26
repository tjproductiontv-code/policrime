// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "auth_token"; // ✅ Zorg dat dit overeenkomt met login.ts

// Routes waarvoor login vereist is
const PROTECTED = [
  "/dashboard",
  "/dossiers",
  "/kantoor",
  "/privileges",
  "/votes",
  "/earn",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = new URL("/sign-in", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Alleen matchen op protected paden
export const config = {
  matcher: ["/dashboard/:path*", "/dossiers/:path*", "/kantoor/:path*", "/privileges/:path*", "/votes/:path*", "/earn/:path*"],
};
