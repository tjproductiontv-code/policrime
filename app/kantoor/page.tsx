// app/kantoor/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { INVESTIGATOR_PRICE } from "@/lib/investigations";
import { settleInvestigationsForUser } from "@/lib/settleInvestigations";
import InvestigatorBuyForm from "./ui/InvestigatorBuyForm";
import InvestigationStartForm from "./ui/InvestigationStartForm";
import Countdown from "@/components/Countdown";
import Pagination from "./ui/Pagination";

const PAGE_SIZE = 10;

export default async function KantoorPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <main className="p-6">Niet ingelogd.</main>;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, money: true, investigators: true, investigatorsBusy: true },
  });
  if (!me) return <main className="p-6">User niet gevonden.</main>;

  // Rond aflopende onderzoeken af (en geef busy vrij)
  await settleInvestigationsForUser(me.id);

  // Refresh stats
  const fresh = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, investigators: true, investigatorsBusy: true },
  });

  const total = fresh?.investigators ?? 0;
  const busy = fresh?.investigatorsBusy ?? 0;
  const available = Math.max(0, total - busy);

  // Alleen tonen: lopend of afgerond < 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ⬇️ Cleanup: verwijder afgeronde onderzoeken ouder dan 24h
  await prisma.investigation.deleteMany({
    where: { completedAt: { lt: cutoff } },
  });

  const where = {
    attackerId: me.id,
    OR: [{ completedAt: null }, { completedAt: { gte: cutoff } }],
  } as const;

  // Paginatie
  const page = Math.max(1, Math.floor(Number(searchParams?.page ?? "1")) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [rows, totalCount] = await Promise.all([
    prisma.investigation.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        assigned: true,
        startedAt: true,
        etaAt: true,
        completedAt: true,
        consumedAt: true,
        target: { select: { name: true } },
      },
    }),
    prisma.investigation.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Kantoor</h1>

      <div className="rounded border p-4">
        <div className="font-semibold mb-1">Onderzoekers</div>
        <p className="text-sm text-gray-700">
          In dienst: <b>{total}</b> • Bezet: <b>{busy}</b> • Vrij: <b>{available}</b> • Saldo: €
          {(fresh?.money ?? 0).toLocaleString("nl-NL")}
        </p>
        <p className="text-sm text-gray-700">
          Prijs per onderzoeker: €{INVESTIGATOR_PRICE.toLocaleString("nl-NL")}
        </p>
        <div className="mt-3">
          <InvestigatorBuyForm />
        </div>
      </div>

      <div className="rounded border p-4">
        <div className="font-semibold mb-2">Start een onderzoek</div>
        <InvestigationStartForm maxAssignable={available} />
        <p className="text-xs text-gray-500 mt-2">
          Minimale duur is altijd 30 minuten. Hogere rang = zwaarder (20% per level).
        </p>
      </div>

      <div className="rounded border p-4">
        <div className="font-semibold mb-2">Jouw onderzoeken</div>

        <ul className="space-y-2">
          {rows.map((inv) => {
            const status = inv.completedAt ? (inv.consumedAt ? "verbruikt" : "gereed") : "bezig";
            return (
              <li key={inv.id} className="border rounded p-2">
                <div className="text-sm">
                  Doel: <b>{inv.target.name}</b> • Ingezet: {inv.assigned} • Status: <b>{status}</b>
                </div>
                {!inv.completedAt ? (
                  <div className="text-xs text-gray-600">
                    Klaar over <Countdown until={inv.etaAt.toISOString()} />
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">
                    Afgerond op {new Date(inv.completedAt).toLocaleString("nl-NL")}
                  </div>
                )}
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="text-sm text-gray-600">Geen onderzoeken om te tonen.</li>
          )}
        </ul>

        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} />
          <p className="text-xs text-gray-500 mt-2">
            Afgeronde onderzoeken verdwijnen automatisch uit dit overzicht na 24 uur.
          </p>
        </div>
      </div>
    </main>
  );
}
