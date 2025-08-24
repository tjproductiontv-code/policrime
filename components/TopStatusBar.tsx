// components/TopStatusBar.tsx
export const dynamic = "force-dynamic"; // cache uit

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "../lib/prisma";

type UserBar = {
  email: string;
  money: number;
  votes: number;
  passivePerHour: number;
  name: string;
  dossiers: number;
  hpBP: number;
  lastPassiveAt: Date | null;
};

export default async function TopStatusBar() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    // Niet ingelogd: houd de oude, rustige look
    return (
      <div className="mb-4 flex items-center justify-between rounded-xl border bg-white p-3">
        <div className="font-medium">PoliPower</div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      money: true,
      votes: true,
      passivePerHour: true,
      name: true,
      dossiers: true,
      hpBP: true,
      lastPassiveAt: true,
    },
  });

  // Als de user niet gevonden is, toon gewoon de balk zonder stats
  if (!user) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-xl border bg-white p-3">
        <div className="font-medium">PoliPower</div>
      </div>
    );
  }

  const hpText = (user.hpBP / 100).toFixed(2); // 10000 → 100.00 HP
  const last = user.lastPassiveAt ? new Date(user.lastPassiveAt) : null;
  const lastIsTopOfHour =
    !!last &&
    last.getMinutes() === 0 &&
    last.getSeconds() === 0 &&
    last.getMilliseconds() === 0;

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border bg-white p-3">
      <div className="font-medium">PoliPower</div>

      <div className="flex items-center gap-4 text-sm text-gray-700">
        <span aria-label="Geld">💰 <b>{user.money.toLocaleString("nl-NL")}</b></span>
        <span aria-label="Stemmen">🗳️ <b>{user.votes.toLocaleString("nl-NL")}</b></span>
        <span aria-label="Uurlijks inkomen">
          ⏳ <b>{user.passivePerHour.toLocaleString("nl-NL")}</b>/uur
        </span>
        <span aria-label="Dossiers">📂 <b>{user.dossiers}</b></span>
        <span aria-label="Naam">👤 <b>{user.name}</b></span>
        <span aria-label="Gezondheid">❤️ <b>{hpText}</b></span>

        {/* DEV-indicator: toont timestamp en of die exact op :00 staat (alleen in development) */}
        {process.env.NODE_ENV === "development" && last && (
          <span className="flex items-center gap-1 text-xs opacity-70">
            ⏲️ {last.toLocaleTimeString("nl-NL")}
            <span
              className={`ml-1 inline-block h-2 w-2 rounded-full ${
                lastIsTopOfHour ? "bg-green-500" : "bg-amber-500"
              }`}
              title={lastIsTopOfHour ? "Exact op :00" : "Niet op :00"}
            />
            {/* Debug eventueel: {user.email} */}
          </span>
        )}
      </div>
    </div>
  );
}
