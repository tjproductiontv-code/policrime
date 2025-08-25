// app/earn/page.tsx
import { prisma } from "../../lib/prisma";
import {
  COOLDOWN_SEC,
  investigationChance,
} from "../../lib/game";
import Countdown from "../../components/Countdown";
import { EarnActionButton } from "../../components/EarnActionButton";
import InvestigationBanner from "../../components/InvestigationBanner";
import { getUserFromCookie } from "../../lib/auth";

function fmtCooldown(totalSec: number) {
  if (totalSec < 60) return `${totalSec} sec`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s ? `${m} min ${s} sec` : `${m} min`;
}

export default async function EarnPage() {
  const userFromCookie = await getUserFromCookie();

  if (!userFromCookie?.id) {
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
    where: { id: userFromCookie.id },
    select: {
      money: true,
      level: true,
      investigationUntil: true,

      // ⬇️ alle last-velden die we op de pagina gebruiken
      lastParkeerboeteAt: true,
      lastNepfactuurAt: true,
      lastVriendjeAt: true,
      lastDonatieAt: true,
      lastStemmenhandelAt: true,
    },
  });

  if (!user) {
    return (
      <main className="p-6">
        <p>Gebruiker niet gevonden.</p>
      </main>
    );
  }

  const now = Date.now();
  const asReadyISO = (last: Date | null | undefined, cooldownSeconds: number) => {
    if (!last) return null;
    const ready = last.getTime() + cooldownSeconds * 1000; // sec -> ms
    return ready > now ? new Date(ready).toISOString() : null;
  };

  const level = user.level ?? 1;

  // ✨ bereken readyAt’s per actie, met cooldown uit lib/game.ts
  const parkeerboeteReadyAt   = asReadyISO(user.lastParkeerboeteAt, COOLDOWN_SEC.parkeerboete);
  const nepfactuurReadyAt     = asReadyISO(user.lastNepfactuurAt,   COOLDOWN_SEC.nepfactuur);
  const vriendjeReadyAt       = asReadyISO(user.lastVriendjeAt,     COOLDOWN_SEC.vriendje);
  const donatieReadyAt        = asReadyISO(user.lastDonatieAt,      COOLDOWN_SEC.donatie);
  const stemmenhandelReadyAt  = asReadyISO(user.lastStemmenhandelAt,COOLDOWN_SEC.stemmenhandel);

  // kansen per actie (aflopend met level via investigationChance)
  const pct = (action: any) => Math.round(investigationChance(action, level) * 100);
  const parkeerboetePct  = pct("parkeerboete");
  const nepfactuurPct    = pct("nepfactuur");
  const vriendjePct      = pct("vriendje");
  const donatiePct       = pct("donatie");
  const stemmenhandelPct = pct("stemmenhandel");

  const investigationUntilISO =
    user.investigationUntil && user.investigationUntil.getTime() > now
      ? user.investigationUntil.toISOString()
      : null;

  const locked = Boolean(investigationUntilISO);
  const moneyFormatted = `€${(user.money ?? 0).toLocaleString("nl-NL")}`;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Geld verdienen</h1>
        <p>Huidig saldo: {moneyFormatted}</p>
      </div>

      {locked && <InvestigationBanner untilISO={investigationUntilISO} />}

      <ul className="space-y-3">

        {/* 1) Parkeerboete — bovenaan */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Parkeerboete laten verdwijnen</p>
            <p className="text-sm text-gray-500">
              Beloning: €50 • Cooldown: {fmtCooldown(COOLDOWN_SEC.parkeerboete)} • {parkeerboetePct}% kans op onderzoek
            </p>
            <p className="text-xs text-gray-500">Scheelt geld en levert reputatie bij vrienden op.</p>
            {parkeerboeteReadyAt && (
              <p className="text-sm mt-1">
                Nog <Countdown until={parkeerboeteReadyAt} /> cooldown
              </p>
            )}
          </div>
          <EarnActionButton
            endpoint="/api/game/earn/parkeerboete"
            label="Verdien €50"
            readyAt={parkeerboeteReadyAt}
            locked={locked}
          />
        </li>

        {/* 2) Nepfactuur */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Nepfactuur goedkeuren</p>
            <p className="text-sm text-gray-500">
              Beloning: €100 • Cooldown: {fmtCooldown(COOLDOWN_SEC.nepfactuur)} • {nepfactuurPct}% kans op onderzoek
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

        {/* 3) Vriendje */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Vriendje een baantje geven</p>
            <p className="text-sm text-gray-500">
              Beloning: €250 • Cooldown: {fmtCooldown(COOLDOWN_SEC.vriendje)} • {vriendjePct}% kans op onderzoek
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

        {/* 4) Donatie — onder Vriendje */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Donatie in ruil voor vergunning</p>
            <p className="text-sm text-gray-500">
              Beloning: €300 • Cooldown: {fmtCooldown(COOLDOWN_SEC.donatie)} • {donatiePct}% kans op onderzoek
            </p>
            <p className="text-xs text-gray-500">Bedrijf betaalt je om iets sneller geregeld te krijgen.</p>
            {donatieReadyAt && (
              <p className="text-sm mt-1">
                Nog <Countdown until={donatieReadyAt} /> cooldown
              </p>
            )}
          </div>
          <EarnActionButton
            endpoint="/api/game/earn/donatie"
            label="Verdien €300"
            readyAt={donatieReadyAt}
            locked={locked}
          />
        </li>

        {/* 5) Stemmenhandel */}
        <li className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Stemmenhandel</p>
            <p className="text-sm text-gray-500">
              Cooldown: {fmtCooldown(COOLDOWN_SEC.stemmenhandel)} • {stemmenhandelPct}% kans op onderzoek
            </p>
            <p className="text-xs text-gray-500">
              Je verkoopt een groep stemmen aan de hoogste bieder. (Kan gratis stemmen opleveren; bij gepakt: -1% reputatie en 10 min onderzoek)
            </p>
            {stemmenhandelReadyAt && (
              <p className="text-sm mt-1">
                Nog <Countdown until={stemmenhandelReadyAt} /> cooldown
              </p>
            )}
          </div>
          <EarnActionButton
            endpoint="/api/game/earn/stemmenhandel"
            label="Doe stemmenhandel"
            readyAt={stemmenhandelReadyAt}
            locked={locked}
          />
        </li>

      </ul>
    </main>
  );
}
