// app/earn/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { TEN_MIN, FOURTEEN_MIN, investigationChance } from "@/lib/game"; // ← voeg investigationChance toe
import Countdown from "@/components/Countdown";
import { EarnActionButton } from "@/components/EarnActionButton";
import InvestigationBanner from "@/components/InvestigationBanner";

export default async function EarnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Niet ingelogd</h1>
        <p>
          Ga naar <code>/sign-in</code> om in te loggen.
        </p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      money: true,
      lastNepfactuurAt: true,
      lastVriendjeAt: true,
      investigationUntil: true,
      level: true, // ← level meenemen
    },
  });

  if (!user) {
    return (
      <main className="p-6">
        <p>User niet gevonden.</p>
      </main>
    );
  }

  const now = Date.now();

  // Helper: geeft ISO-eindtijd terug als de cooldown nog loopt, anders null
  const asReadyISO = (last: Date | null | undefined, cooldownSeconds: number) => {
    if (!last) return null;
    const ready = last.getTime() + cooldownSeconds * 1000;
    return ready > now ? new Date(ready).toISOString() : null;
  };

  const nepfactuurReadyAt = asReadyISO(user.lastNepfactuurAt, TEN_MIN);
  const vriendjeReadyAt = asReadyISO(user.lastVriendjeAt, FOURTEEN_MIN);

  // Onderzoek: alleen actief als de eindtijd in de toekomst ligt
  const investigationUntilISO =
    user.investigationUntil && user.investigationUntil.getTime() > now
      ? user.investigationUntil.toISOString()
      : null;

  const locked = Boolean(investigationUntilISO);
  const moneyFormatted = `€${(user.money ?? 0).toLocaleString("nl-NL")}`;

  // ⬇️ Dynamische kansen op basis van level (zelfde bron als in je API)
  const level = user.level ?? 1;
  const nepfactuurPct = Math.round(investigationChance("nepfactuur", level) * 100);
  const vriendjePct   = Math.round(investigationChance("vriendje",   level) * 100);

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Geld verdienen</h1>
        <p>Huidig saldo: {moneyFormatted}</p>
      </div>

      {/* Onderzoek-banner (toont ook Koop-vrij met €10/sec) */}
      {locked && <InvestigationBanner untilISO={investigationUntilISO} />}

      <ul className="space-y-3">
        {/* Nepfactuur */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Nepfactuur goedkeuren</p>
            <p className="text-sm text-gray-500">
              Beloning: €100 • Cooldown: 10 min • {nepfactuurPct}% kans op onderzoek
            </p>
            {nepfactuurReadyAt && (
              <p className="text-sm mt-1">
                Nog <Countdown until={nepfactuurReadyAt} /> cooldown
              </p>
            )}
          </div>
          <EarnActionButton
            endpoint="/api/game/earn/nepfactuur"
            label="Verdien €100"
            readyAt={nepfactuurReadyAt}
            locked={locked}
          />
        </li>

        {/* Vriendje */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Vriendje een baantje geven</p>
            <p className="text-sm text-gray-500">
              Beloning: €250 • Cooldown: 14 min • {vriendjePct}% kans op onderzoek
            </p>
            {vriendjeReadyAt && (
              <p className="text-sm mt-1">
                Nog <Countdown until={vriendjeReadyAt} /> cooldown
              </p>
            )}
          </div>
          <EarnActionButton
            endpoint="/api/game/earn/vriendje"
            label="Verdien €250"
            readyAt={vriendjeReadyAt}
            locked={locked}
          />
        </li>
      </ul>
    </main>
  );
}
