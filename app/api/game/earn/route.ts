// app/api/game/earn/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

// Optioneel: een GET die gewoon laat zien dat je ingelogd bent
export async function GET() {
  const user = getUserFromCookie();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Voorbeeld: haal iets simpels op (mag je weghalen/aanpassen)
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, money: true, level: true }
  });

  return NextResponse.json({ ok: true, me });
}

// Voorbeeld-POST (placeholder): pas aan voor jouw eigen earn-logica
export async function POST() {
  const user = getUserFromCookie();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
