// app/netwerk/page.tsx
import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { getUserFromCookie } from "../../lib/auth";
import ConnectButton from "../../components/ConnectButton";
import NetworkInfoButton from "../../components/NetworkInfoButton"; // ⬅️ nieuw

export const dynamic = "force-dynamic";

function pctFromBps(bps: number) {
  return (bps / 100).toFixed(2) + "%";
}

export default async function NetwerkLobby() {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-2">Netwerk</h1>
        <p>Niet ingelogd. Ga naar <code>/sign-in</code>.</p>
      </main>
    );
  }

  const uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key: "anika" } },
    select: { level: true, progressBps: true },
  });

  const level = uc?.level ?? 0;
  const progressBps = uc?.progressBps ?? 0;
  const unlocked = level >= 1;

  return (
    <main className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold font-serif text-slate-900">Netwerk</h1>
        <p className="text-slate-600">Bouw connecties op om speciale pagina’s vrij te spelen.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold font-serif text-slate-900">De Lobby</h2>
        <p className="text-sm text-slate-600">Bereik level 1 met een connectie om de bijbehorende pagina te openen.</p>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">Politieke fixer Anika – Stemmen-handel</p>
              <p className="text-xs text-slate-600">Koop stemmen met <b>korting</b> — prijs varieert met de markt</p>
              <p className="text-xs text-slate-600 mt-1">Level {level} • Progressie {pctFromBps(progressBps)}</p>
            </div>

            <div className="flex items-center gap-2">
              {unlocked ? (
                <Link href="/netwerk/stemmen-handel" className="text-emerald-700 underline hover:no-underline">
                  Naar pagina
                </Link>
              ) : (
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                  Nog niet vrijgespeeld
                </span>
              )}
              {/* ⬅️ ℹ knop */}
              <NetworkInfoButton />
            </div>
          </div>

          <ProgressBar value={progressBps} />
          <ConnectButton connectionKey="anika" />
        </li>
      </ul>
    </main>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
      <div className="h-3 bg-emerald-600" style={{ width: `${Math.min(100, value / 100)}%` }} />
    </div>
  );
}
