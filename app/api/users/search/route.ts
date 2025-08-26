// app/api/users/search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // let op: relative path zonder @-alias
import { getUserFromCookie } from "../../../../lib/auth";

const LIMIT = 10;

function parseQueryFromUrl(url: string) {
  const u = new URL(url);
  const q = u.searchParams.get("q") || u.searchParams.get("query") || "";
  return q;
}

export async function GET(req: Request) {
  // optioneel: alleen voor ingelogden
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = parseQueryFromUrl(req.url).trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await prisma.user.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: LIMIT,
    select: { id: true, name: true, email: true, level: true },
  });

  return NextResponse.json({ results });
}

export async function POST(req: Request) {
  const me = await getUserFromCookie();
  if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const q = String(body?.q ?? body?.query ?? body?.name ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await prisma.user.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: LIMIT,
    select: { id: true, name: true, email: true, level: true },
  });

  return NextResponse.json({ results });
}
