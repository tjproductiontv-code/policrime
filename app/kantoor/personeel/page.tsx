// app/kantoor/personeel/page.tsx
import Link from "next/link";
import { getUserFromCookie } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import {
  EMPLOYEE_HOURLY_COST,
  WORKSPACE_UNIT_PRICE,
  WORKSPACE_UNITS_PER_EMPLOYEE,
  DOSSIERS_PER_EMPLOYEE,
  dossierCapacity,
  maxEmployeesByWorkspace,
} from "../../../lib/personnel";
import HireCivilServantsForm from "./ui/HireCivilServantsForm";
import BuyWorkspaceForm from "./ui/BuyWorkspaceForm";

export const dynamic = "force-dynamic";

// ✅ juiste tab-waarden
type Tab = "ambtenaren" | "werkplekken";

const fmt = (n: number) => n.toLocaleString("nl-NL");

function Stat({
  label,
  value,
  caption,
  icon,
  title,
}: {
  label: string;
  value: string;
  caption?: string;
  icon?: string;
  title?: string;
}) {
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

function Tabs({ active }: { active: Tab }) {
  const base = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm transition";
  const on = "bg-gray-900 text-white shadow-sm";
  const off = "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent";
  return (
    <div className="inline-flex gap-2 bg-gray-50 p-1 rounded-full border">
      <Link
        href="/kantoor/personeel?tab=ambtenaren"
        className={`${base} ${active === "ambtenaren" ? on : off}`}
      >
        👔 Personeel
      </Link>
      <Link
        href="/kantoor/personeel?tab=werkplekken"
        className={`${base} ${active === "werkplekken" ? on : off}`}
      >
        🧱 Werkplekken
      </Link>
    </div>
  );
}

export default async function PersoneelPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const me = await getUserFromCookie();
  if (!me?.id) return <main className="p-6">Niet ingelogd.</main>;

  const u = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      money: true,
      passivePerHour: true, // NETTO per uur
      civilServants: true,
      workspaceUnits: true,
      dossiers: true,
    },
  });

  const civil = u?.civilServants ?? 0;
  const units = u?.workspaceUnits ?? 0;
  const cap = dossierCapacity(civil); // +100 per ambtenaar
  const used = u?.dossiers ?? 0;
  const free = Math.max(0, cap - used);

  // salarissen + netto + bruto
  const salaryPerHour = civil * EMPLOYEE_HOURLY_COST;
  const netPerHour = u?.passivePerHour ?? 0;
  const grossPerHour = netPerHour + salaryPerHour;

  // limieten
  const maxByWs = maxEmployeesByWorkspace(units);
  const canAffordByIncome = Math.floor(grossPerHour / EMPLOYEE_HOURLY_COST);

  // tab-keuze
  const tabParam = Array.isArray(searchParams?.tab) ? searchParams?.tab[0] : searchParams?.tab;
  const tab: Tab = tabParam === "werkplekken" ? "werkplekken" : "ambtenaren";

  return (
    <main className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Kantoor <span className="text-gray-400">•</span> Personeel
        </h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Beheer je ambtenaren en werkplekken. Ambtenaren kosten{" "}
          <b>€{fmt(EMPLOYEE_HOURLY_COST)}/uur</b> p.p. en verhogen alleen je{" "}
          <b>capaciteit</b> (+{DOSSIERS_PER_EMPLOYEE} dossiers p.p.). Dossiers verdwijnen niet; je
          vult ze los bij tot je capaciteit.
        </p>
      </header>

      {/* Stat grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="💶"
          label="Inkomen/uur (netto)"
          value={`€${fmt(netPerHour)}`}
          caption={`Na salarissen (−€${fmt(salaryPerHour)}/u)`}
          title="Netto per uur, na aftrek van salarissen."
        />
        <Stat
          icon="📈"
          label="Inkomen/uur (bruto)"
          value={`€${fmt(grossPerHour)}`}
          caption="Voor salariskosten"
          title="Bruto per uur voordat salarissen worden afgetrokken."
        />
        <Stat
          icon="👔"
          label="Ambtenaren"
          value={`${fmt(civil)}`}
          caption={`Salaris: €${fmt(salaryPerHour)}/u`}
          title="Aantal ambtenaren en totale salariskosten."
        />
        <Stat
          icon="🧱"
          label="Werkplekunits (2 m²)"
          value={`${fmt(units)}`}
          caption={`${WORKSPACE_UNITS_PER_EMPLOYEE} per ambtenaar`}
          title="Totaal aantal 2 m²-units. 5 units per ambtenaar nodig."
        />
        <Stat
          icon="📁"
          label="Dossier-capaciteit"
          value={`${fmt(cap)}`}
          caption={`+${DOSSIERS_PER_EMPLOYEE} per ambtenaar`}
          title="Maximaal aantal dossiers in bezit."
        />
        <Stat
          icon="📦"
          label="Dossiers op voorraad"
          value={`${fmt(used)}`}
          caption="Dossiers in bezit"
          title="Huidige voorraad dossiers."
        />
        <Stat
          icon="🆓"
          label="Nog bij te kopen"
          value={`${fmt(free)}`}
          caption={`Vrije capaciteit — cap ${fmt(cap)} (${fmt(cap)} − ${fmt(used)})`}
          title="Zoveel dossiers kun je nog bijkopen."
        />
        <Stat
          icon="✅"
          label="Max ambtenaren mogelijk nu"
          value={`${fmt(Math.min(maxByWs, canAffordByIncome))}`}
          caption="Beperkt door werkplekken en bruto inkomen/uur."
          title="Max haalbaar met huidige werkplekken en bruto inkomen."
        />
      </section>

      {/* Tabs + panes */}
      <section className="space-y-4">
        <Tabs active={tab} />

        {tab === "ambtenaren" ? (
          // ✅ compacte kaart in grid (1/3 op xl)
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Ambtenaren</h2>
                  <p className="text-sm text-gray-600">
                    Maximaal mogelijk o.b.v. werkplekken & bruto inkomen:{" "}
                    <b>{fmt(Math.min(maxByWs, canAffordByIncome))}</b>
                  </p>
                </div>
                <span className="text-xs rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                  €{fmt(EMPLOYEE_HOURLY_COST)}/uur p.p.
                </span>
              </div>

              <div className="mt-5">
                <HireCivilServantsForm
                  hourlyCost={EMPLOYEE_HOURLY_COST}
                  currentCivilServants={civil}
                  passivePerHour={netPerHour} // netto meegeven
                  workspaceUnits={units}
                  workspaceUnitsPerEmployee={WORKSPACE_UNITS_PER_EMPLOYEE}
                />
                <p className="text-xs text-gray-500 mt-3">
                  Ambtenaren heb je nodig voor dossier capaciteit
                </p>
              </div>
            </div>

            {/* Plaatshouders voor extra kaarten als je wilt uitbreiden */}
            {/* <div className="rounded-2xl border bg-white shadow-sm p-6">…</div>
            <div className="rounded-2xl border bg-white shadow-sm p-6">…</div> */}
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Werkplekken kopen</h2>
                  <p className="text-sm text-gray-600">
                    Je hebt <b>{WORKSPACE_UNITS_PER_EMPLOYEE}</b> units per ambtenaar nodig (2 m² per unit).
                  </p>
                </div>
                <span className="text-xs rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                  €{fmt(WORKSPACE_UNIT_PRICE)}/unit
                </span>
              </div>

              <div className="mt-5">
                <BuyWorkspaceForm unitPrice={WORKSPACE_UNIT_PRICE} money={u?.money ?? 0} />
                <p className="text-xs text-gray-500 mt-3">
                  Meer werkplekunits ⇒ ruimte voor meer ambtenaren ⇒ hogere dossier-capaciteit.
                </p>
              </div>
            </div>
            {/* idem: hier kun je later 2 extra kaarten naast zetten */}
          </section>
        )}
      </section>
    </main>
  );
}
