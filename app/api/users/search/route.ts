// app/api/users/search/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let q = (searchParams.get("q") ?? "").trim();
    if (q.startsWith("@")) q = q.slice(1).trim();

    if (q.length < 1) return NextResponse.json([]);

    const users = await prisma.user.findMany({
      where: {
        // Alleen op naam zoeken (email weggelaten)
        name: { contains: q }, // eventueel: { contains: q, mode: "insensitive" }
      },
      // level toevoegen, email verwijderen
      select: { id: true, name: true, level: true },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json(users, { status: 200 });
  } catch (err: any) {
    console.error("users/search error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
