// app/api/actions/propaganda/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";
import { ensureDailyAp } from "@/lib/ap";

/**
 * Kosten en opbrengst per intensiteit
 * (we gebruiken de kolom `actionPoints` als "geld")
 */
const costMap: Record<
  string,
  { cost: number; min: number; max: number }
> = {
  small:  { cost: 5,  min: 5,  max: 15 },
  medium: { cost: 10, min: 15, max: 35 },
  big:    { cost: 20, min: 35, max: 80 },
};

export function GET() {
  // GET is niet toegestaan op dit endpoint
  return new Response(
    JSON.stringify({ error: "Method Not Allowed" }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Allow": "POST",
      },
    }
  );
}

export async function POST(req: Request) {
  const auth = getUserFromCookie();
  if (!auth) {
    // Niet ingelogd → naar login
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const form = await req.formData();
  const intensity = String(form.get("intensity") || "small").toLowerCase();
  const cfg = costMap[intensity] ?? costMap.small;

  // Dagelijkse reset/uitbetaling (zoals je eerder had)
  await ensureDailyAp(auth.id);

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) {
    // Gebruiker bestaat niet (meer) → terug naar login
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  // === Belangrijk stuk: te weinig "geld" → redirect naar pagina ===
  const geld = user.actionPoints; // kolom heet nog zo, maar we tonen dit als "Geld"
  if (geld < cfg.cost) {
    return NextResponse.redirect(new URL("/out-of-funds", req.url), 303);
  }

  // Bepaal invloedstoename (random tussen min/max)
  const gain = Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + cfg.min;

  // Voer actie + log in 1 transactie
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        actionPoints: { decrement: cfg.cost }, // geld - kosten
        influence: { increment: gain },
      },
    }),
    prisma.actionLog.create({
      data: {
        userId: user.id,
        type: "PROPAGANDA",
        cost: cfg.cost,
        influenceChange: gain,
      },
    }),
  ]);

  // Terug naar dashboard
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
