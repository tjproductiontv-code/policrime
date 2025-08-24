import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import DossierBuyForm from "./ui/DossierBuyForm";
import { DOSSIER_PRICE_EUR } from "../../lib/dossiers";

export default async function DossiersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <main className="p-6">Niet ingelogd.</main>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { money: true, dossiers: true },
  });

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dossiers kopen</h1>
      <p className="text-sm text-gray-700">
        Prijs: €{DOSSIER_PRICE_EUR.toLocaleString("nl-NL")} per dossier •
        In bezit: <b>{(user?.dossiers ?? 0).toLocaleString("nl-NL")}</b> •
        Saldo: €{(user?.money ?? 0).toLocaleString("nl-NL")}
      </p>
      <DossierBuyForm />
    </main>
  );
}
