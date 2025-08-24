// app/api/dev/apply/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookie } from "../../../../lib/auth";
import { applyPassiveIncome } from "../../../../lib/applyPassiveIncome";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = getUserFromCookie();
  if (!me?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // Roep jouw helper aan; resultaat kan verschillen per implementatie
  const result = await applyPassiveIncome(me.id as number).catch((e: any) => ({
    error: String(e?.message ?? e),
  }));

  // Je kunt hier specifieker returnen als je helper een vaste shape geeft
  return NextResponse.json({ ok: !("error" in (result as any)), result });
}
