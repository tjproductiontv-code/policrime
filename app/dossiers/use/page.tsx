// app/dossiers/use/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import UseDossiersForm from "@/components/UseDossiersForm";

export default async function DossiersUsePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <main className="p-6">Niet ingelogd.</main>;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return <main className="p-6">User niet gevonden.</main>;

  // Haal je onderzoeken op (laatste 30, pas gerust aan)
  const investigations = await prisma.investigation.findMany({
    where: { attackerId: me.id },
    orderBy: { startedAt: "desc" },
    take: 30,
    select: {
      id: true,
      assigned: true,
      startedAt: true,
      completedAt: true,
      consumedAt: true,
      target: { select: { name: true } },
    },
  });

  const ready = investigations.filter(i => i.completedAt && !i.consumedAt);
  const used  = investigations.filter(i => i.completedAt && i.consumedAt);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dossiers gebruiken</h1>

      {/* Formulier */}
      <UseDossiersForm />

      {/* Overzicht onderzoeken */}
      <section className="rounded border p-4">
        <div className="font-semibold mb-2">Spelers die je onderzocht hebt</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Gereed (dossiers mogelijk)</div>
            {ready.length === 0 ? (
              <p className="text-sm text-gray-600">Geen afgeronde onderzoeken beschikbaar.</p>
            ) : (
              <ul className="text-sm list-disc list-inside space-y-1">
                {ready.map(inv => (
                  <li key={inv.id}>
                    {inv.target.name} • ingezet: {inv.assigned} • afgerond op{" "}
                    {new Date(inv.completedAt!).toLocaleString("nl-NL")}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="font-medium mb-1">Reeds gebruikt</div>
            {used.length === 0 ? (
              <p className="text-sm text-gray-600">Nog niets verbruikt.</p>
            ) : (
              <ul className="text-sm list-disc list-inside space-y-1">
                {used.map(inv => (
                  <li key={inv.id}>
                    {inv.target.name} • ingezet: {inv.assigned} • gebruikt op{" "}
                    {new Date(inv.consumedAt!).toLocaleString("nl-NL")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
