// app/dossiers/page.tsx
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { DOSSIER_PRICE_EUR } from "../../lib/dossiers";
import { dossierCapacity } from "../../lib/personnel";
import DossierBuyForm from "./ui/DossierBuyForm";

export const dynamic = "force-dynamic";

type StatProps = { label: string; value: string; caption?: string; icon?: string; title?: string };
const fmt = (n: number) => n.toLocaleString("nl-NL");

function Stat({ label, value, caption, icon, title }: StatProps) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm p-4" title={title}>
      <div className="flex items-start gap-3">
        {icon ? <div className="text-xl leading-none select-none">{icon}</div> : null}
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
          <div className="text-lg font-semibold text-gray-900">{value}</div>
          {caption ? <div className="text-xs text-gray-500 mt-0.5">{caption}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default async function DossiersPage() {
  const me = await getUserFromCookie();
  if (!me?.id) return <main className="p-6">Niet ingelogd.</main>;

  const u = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, dossiers: true, civilServants: true },
  });

  const money = u?.money ?? 0;
  const stock = u?.dossiers ?? 0;
  const cap = dossierCapacity(u?.civilServants ?? 0);
  const free = Math.max(0, cap - stock);

  const price = DOSSIER_PRICE_EUR;
  const maxByMoney = Math.floor(money / price);
  const maxBuyNow = Math.max(0, Math.min(free, maxByMoney));
  const progress = cap > 0 ? Math.min(100, Math.round((stock / cap) * 100)) : 0;

  return (
    <main className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-white to-gray-50">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dossiers kopen</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Koop dossiers om in te zetten bij onderzoeken. Je capaciteit bepaalt hoeveel dossiers je
          maximaal kunt bezitten; dossiers verdwijnen niet en kun je later weer aanvullen tot je cap.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon="📁" label="Dossier-capaciteit" value={fmt(cap)} caption="+100 per ambtenaar" />
        <Stat icon="📦" label="Voorraad" value={fmt(stock)} caption="Dossiers in bezit" />
        <Stat
          icon="🆓"
          label="Vrije capaciteit"
          value={fmt(free)}
          caption={`Cap ${fmt(cap)} – Voorraad ${fmt(stock)}`}
        />
      </section>

      <section className="rounded-2xl border bg-white shadow-sm p-5">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            In gebruik: <b>{fmt(stock)}</b> / <b>{fmt(cap)}</b>
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gray-900 transition-[width]"
            style={{ width: `${progress}%` }}
            aria-label="capaciteit in gebruik"
            title={`In gebruik: ${fmt(stock)} / ${fmt(cap)} (${progress}%)`}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-white shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Dossiers aanschaffen</h2>
          <span className="text-xs rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            €{fmt(price)} / stuk
          </span>
        </div>

        {/* Form toont de contextregel (Prijs/Vrij/Max) zelf, dus hier niet nogmaals tonen */}
        <DossierBuyForm price={price} freeCapacity={free} maxBuyNow={maxBuyNow} />
      </section>
    </main>
  );
}
