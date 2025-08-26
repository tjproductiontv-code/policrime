// app/dashboard/page.tsx
import type { ComponentType } from "react";
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import Countdown from "../../components/Countdown";
import { settlePassiveIncome } from "../../lib/passive";
import DashboardHealthCard from "../../components/DashboardHealthCard";

export const dynamic = "force-dynamic";

type Rank = { name: string; blurb: string; icon?: string };

const RANKS: Rank[] = [
  { name: "Beginnend Raadslid",     blurb: "Net binnen, nog te gretig en onervaren.",            icon: "🏛️" },
  { name: "Vergunningsfluisteraar", blurb: "Regelt kleine gunsten tegen fooi.",                  icon: "🗂️" },
  { name: "Subsidieslurper",        blurb: "Jij weet waar het gratis geld verstopt zit.",        icon: "💶" },
  { name: "Lobbyvriend",            blurb: "Bedrijven zien jou als hun mannetje in de politiek.", icon: "🤝" },
  { name: "Bureaucratiebaas",       blurb: "Je kent elk achterdeurtje in de regels.",            icon: "🗃️" },
  { name: "Belastingontduiker",     blurb: "Geld stroomt via schimmige constructies.",           icon: "🕵️‍♂️" },
  { name: "Budgetplunderaar",       blurb: "Laat miljoenen verdwijnen zonder dat iemand het merkt.", icon: "💸" },
  { name: "Marionettenmeester",     blurb: "Jij trekt de touwtjes; anderen voeren uit.",         icon: "🎭" },
  { name: "Olie- & Wapenhandelaar", blurb: "Internationale lijnen en enorme geldstromen.",       icon: "🛢️" },
  { name: "De Onschendbare",        blurb: "Jij bént de macht; niemand durft je aan te raken.",  icon: "👑" },
];

const fmt = (n: number) => n.toLocaleString("nl-NL");

/** Voortgangsbalk: cap visueel op 100%, label toont 2 decimalen */
function ProgressBar({
  pct,
  title,
  size = "lg",
  showLabel = true,
}: {
  pct: number;
  title?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  const widthPct = clamped.toFixed(2);

  const h =
    size === "lg" ? "h-3.5" :
    size === "md" ? "h-2.5" :
    /* sm */         "h-1.5";

  return (
    <div className={`mt-2 w-full rounded-full bg-gray-200/70 overflow-hidden ${h}`} title={title}>
      <div className="relative h-full bg-emerald-600 transition-[width]" style={{ width: `${widthPct}%` }}>
        {showLabel && (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white/95 select-none">
            {Number(widthPct).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

/** Compacte stat-tegel */
function Stat({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/85 backdrop-blur-sm shadow-sm p-4">
      <div className="flex items-start gap-3">
        {icon ? <div className="text-xl select-none">{icon}</div> : null}
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
          <div className="text-lg font-semibold text-gray-900">{value}</div>
          {caption ? <div className="text-xs text-gray-500 mt-0.5">{caption}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Rang-grid; actieve rang uitgelicht */
function RankGrid({ level }: { level: number }) {
  const activeIdx = Math.max(1, Math.min(RANKS.length, level)) - 1;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {RANKS.map((r, i) => {
        const active = i === activeIdx;
        return (
          <div
            key={r.name}
            className={[
              "rounded-xl border p-3 bg-white/80 shadow-sm flex items-start gap-3 transition",
              active ? "ring-2 ring-gray-900 scale-[1.02]" : "opacity-95",
            ].join(" ")}
            title={`Level ${i + 1}: ${r.name}`}
          >
            <div
              className={[
                "h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0",
                active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700",
              ].join(" ")}
            >
              {r.icon ?? "☆"}
            </div>
            <div className="min-w-0">
              <div className={active ? "font-semibold text-gray-900" : "text-gray-800"}>
                {i + 1}. {r.name}
              </div>
              <div className="text-xs text-gray-500 line-clamp-2">{r.blurb}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const HealthCard = DashboardHealthCard as unknown as ComponentType<{
  title: string;
  value: number | string;
  percent?: number;
}>;

export default async function Dashboard() {
  // Auth
  const me = await getUserFromCookie();
  if (!me?.id) return <main className="p-6">Niet ingelogd.</main>;

  // 1) Huidige user
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      name: true,
      money: true,
      passivePerHour: true,
      lastPassiveAt: true,
      dossiers: true,
      votes: true,
      level: true,
      levelProgress: true, // 0..∞ (float)
      hpBP: true,
    },
  });
  if (!user) return <main className="p-6">User niet gevonden.</main>;

  // 2) Passief inkomen toepassen
  await settlePassiveIncome(user.id);

  // 3) Vers opgehaald
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      money: true,
      passivePerHour: true,
      lastPassiveAt: true,
      dossiers: true,
      votes: true,
      level: true,
      levelProgress: true,
      hpBP: true,
    },
  });

  const name = fresh?.name ?? user.name ?? "Speler";
  const money = fresh?.money ?? user.money ?? 0;
  const perHour = fresh?.passivePerHour ?? user.passivePerHour ?? 0;
  const dossiers = fresh?.dossiers ?? user.dossiers ?? 0;
  const votes = fresh?.votes ?? user.votes ?? 0;
  const level = fresh?.level ?? user.level ?? 1;

  // ✅ progress: tekst mag >100% bij max level; balk capped op 100%
  const rawProgress = Number(fresh?.levelProgress ?? user.levelProgress ?? 0);
  const isMaxLevel = level >= 10;

  const levelProgressText = Number(rawProgress.toFixed(2));                // kan > 100
  const levelProgressBar  = Math.max(0, Math.min(100, levelProgressText)); // cap 0..100

  // reputatie (als hpBP in 0..10000 werkt, pas evt. deling / mapping aan)
  const reputation = Math.max(
    0,
    Math.min(100, Math.round((fresh?.hpBP ?? user.hpBP ?? 100) as number))
  );

  const nextISO =
    fresh?.lastPassiveAt
      ? new Date(fresh.lastPassiveAt.getTime() + 60 * 60 * 1000).toISOString()
      : null;

  const rank = RANKS[Math.max(0, Math.min(RANKS.length - 1, level - 1))];

  return (
    <main className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-white to-gray-50">
      {/* Kop */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welkom, {name}</h1>
        <p className="text-sm text-gray-600">Saldo: <b>€{fmt(money)}</b></p>
      </header>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon="🏦" label="Saldo" value={`€${fmt(money)}`} caption="Huidig tegoed" />
        <Stat icon="💶" label="Inkomen per uur" value={`€${fmt(perHour)}`} caption="Passief inkomen" />
        <Stat icon="📁" label="Dossiers" value={`${fmt(dossiers)}`} caption="Op voorraad" />
        <Stat icon="🗳️" label="Stemmen" value={`${fmt(votes)}`} caption="Beschikbaar" />
      </section>

      {/* Rang + progress */}
      <section className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Jouw rang</div>
            <div className="text-xl font-semibold text-gray-900">{rank?.name ?? "—"}</div>
            <div className="text-sm text-gray-600">{rank?.blurb ?? "Vorder door te spelen."}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-gray-500">Progressie</div>
            <div className="text-sm font-medium text-gray-900">
              {levelProgressText.toFixed(2)}%
              {!isMaxLevel && (
                <span className="text-gray-500">
                  {" "}&bull; Nog {(100 - levelProgressBar).toFixed(2)}%
                </span>
              )}
            </div>
            <ProgressBar
              pct={levelProgressBar} // 🔒 visueel max 100%
              title={`Progressie: ${levelProgressText.toFixed(2)}%`}
            />
          </div>
        </div>
        <RankGrid level={level} />
      </section>

      {/* Reputatie */}
      <section>
        <HealthCard title="Reputatie" value={reputation} percent={reputation} />
      </section>

      {/* Passief inkomen */}
      <section className="rounded-2xl border bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Passief inkomen</div>
            <div className="text-lg font-semibold text-gray-900">€{fmt(perHour)} / uur</div>
            <div className="text-sm text-gray-600">
              {perHour > 0 ? (
                nextISO ? (
                  <>Volgende uitbetaling over <Countdown until={nextISO} /></>
                ) : (
                  <>Passief inkomen actief. De eerste uitbetaling start vanaf nu.</>
                )
              ) : (
                <>Nog geen passief inkomen. Koop <b>Privileges</b> om dit te activeren.</>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
