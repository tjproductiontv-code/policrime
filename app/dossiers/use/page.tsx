// app/dossiers/use/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUserFromCookie } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { settleInvestigationsForUser } from "../../../lib/settleInvestigations";
import UseDossiersForm from "./ui/UseDossiersForm";

// helper: bepaal of target geëlimineerd is
function isEliminatedFromTarget(t: { influence?: number | null } | null | undefined): boolean | null {
  if (!t || typeof t.influence !== "number") return null;
  return t.influence <= 0;
}

export default async function DossiersUsePage() {
  // ✅ Auth fix
  const me = await getUserFromCookie();
  if (!me?.id) redirect("/sign-in");

  await settleInvestigationsForUser(me.id);

  const [ready, used10, meUser] = await Promise.all([
    prisma.investigation.findMany({
      where: { attackerId: me.id, completedAt: { not: null }, consumedAt: null },
      orderBy: { completedAt: "desc" },
      take: 30,
      select: {
        id: true,
        assigned: true,
        completedAt: true,
        target: { select: { id: true, name: true } },
      },
    }),
    prisma.investigation.findMany({
      where: { attackerId: me.id, completedAt: { not: null }, consumedAt: { not: null } },
      orderBy: { consumedAt: "desc" },
      take: 10,
      select: {
        id: true,
        assigned: true,
        consumedAt: true,
        target: { select: { id: true, name: true, influence: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: me.id }, select: { dossiers: true } }),
  ]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dossiers gebruiken</h1>

      <UseDossiersForm initialDossiers={meUser?.dossiers ?? 0} />

      <section className="rounded border p-4">
        <div className="font-semibold mb-2">Spelers die je onderzocht hebt</div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gereed */}
          <div>
            <div className="font-medium mb-2">Gereed (dossiers mogelijk)</div>
            {ready.length === 0 ? (
              <p className="text-sm text-gray-600">Geen afgeronde onderzoeken beschikbaar.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {ready.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{inv.target?.name ?? `#${inv.id}`}</span>
                      <span className="text-gray-500">
                        {" "}• ingezet: {inv.assigned} • afgerond{" "}
                        {new Date(inv.completedAt!).toLocaleString("nl-NL")}
                      </span>
                    </div>
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      gereed
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reeds gebruikt */}
          <div>
            <div className="font-medium mb-2">Reeds gebruikt (laatste 10)</div>
            {used10.length === 0 ? (
              <p className="text-sm text-gray-600">Nog niets verbruikt.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {used10.map((inv) => {
                  const elim = isEliminatedFromTarget(inv.target);
                  return (
                    <li key={inv.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{inv.target?.name ?? `#${inv.id}`}</span>
                        <span className="text-gray-500">
                          {" "}• ingezet: {inv.assigned} • gebruikt{" "}
                          {new Date(inv.consumedAt!).toLocaleString("nl-NL")}
                        </span>
                      </div>
                      {elim === true ? (
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Gelukt</span>
                      ) : elim === false ? (
                        <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded">Mislukt</span>
                      ) : (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">Onbekend</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
