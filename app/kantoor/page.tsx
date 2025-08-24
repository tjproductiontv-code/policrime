// app/kantoor/page.tsx
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { settleInvestigationsForUser } from "../../lib/settleInvestigations";
import { INVESTIGATOR_PRICE } from "../../lib/investigations";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function KantoorPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const me = getUserFromCookie();
  if (!me?.id) {
    return <main className="p-6">Niet ingelogd.</main>;
  }

  // Optioneel: lopende onderzoeken afwikkelen voor we tonen
  await settleInvestigationsForUser(me.id);

  // Paginering
  const page = Number(searchParams?.page ?? 1);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const skip = (safePage - 1) * PAGE_SIZE;

  // Laat lopende + recent afgeronde onderzoeken zien (bijv. laatste 14 dagen)
  const recentWindowMs = 14 * 24 * 60 * 60 * 1000;
  const recentThreshold = new Date(Date.now() - recentWindowMs);

  // ✅ Belangrijk: typ de where en gebruik een NIET-readonly array voor OR
  const where: Prisma.InvestigationWhereInput = {
    attackerId: me.id,
    OR: [
      { completedAt: null },
      { completedAt: { gte: recentThreshold } },
    ],
  };

  const [rows, totalCount, meUser] = await Promise.all([
    prisma.investigation.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        targetId: true,
        assigned: true,
        startedAt: true,
        etaAt: true,
        completedAt: true,
        consumedAt: true,
        target: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.investigation.count({ where }),
    prisma.user.findUnique({
      where: { id: me.id },
      select: { investigators: true, investigatorsBusy: true, money: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Kantoor</h1>
        <p className="text-sm text-gray-600">
          Onderzoekers: <b>{meUser?.investigators ?? 0}</b> &middot; Bezet:{" "}
          <b>{meUser?.investigatorsBusy ?? 0}</b> &middot; Prijs per onderzoeker: €
          {INVESTIGATOR_PRICE.toLocaleString("nl-NL")} &middot; Saldo: €
          {(meUser?.money ?? 0).toLocaleString("nl-NL")}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Onderzoeken</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full border rounded">
            <thead className="bg-gray-50 text-left text-sm">
              <tr>
                <th className="p-2 border-b">ID</th>
                <th className="p-2 border-b">Doelwit</th>
                <th className="p-2 border-b">Ingezet</th>
                <th className="p-2 border-b">Gestart</th>
                <th className="p-2 border-b">ETA</th>
                <th className="p-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={6}>
                    Geen onderzoeken gevonden.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const status = r.completedAt
                    ? "Afgerond"
                    : r.etaAt && r.etaAt.getTime() > Date.now()
                    ? "Lopend"
                    : "In afwikkeling";
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="p-2">{r.id}</td>
                      <td className="p-2">
                        {r.target?.name ?? r.target?.email ?? r.targetId}
                      </td>
                      <td className="p-2">{r.assigned}</td>
                      <td className="p-2">{new Date(r.startedAt).toLocaleString("nl-NL")}</td>
                      <td className="p-2">{new Date(r.etaAt).toLocaleString("nl-NL")}</td>
                      <td className="p-2">{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* eenvoudige paginering */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Pagina {safePage} / {totalPages}
          </span>
          <nav className="ml-auto flex gap-2">
            <a
              className="px-3 py-1 border rounded text-sm pointer-events-auto"
              aria-disabled={safePage <= 1}
              href={safePage > 1 ? `/kantoor?page=${safePage - 1}` : "#"}
            >
              ← Vorige
            </a>
            <a
              className="px-3 py-1 border rounded text-sm pointer-events-auto"
              aria-disabled={safePage >= totalPages}
              href={safePage < totalPages ? `/kantoor?page=${safePage + 1}` : "#"}
            >
              Volgende →
            </a>
          </nav>
        </div>
      </section>
    </main>
  );
}
