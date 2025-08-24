// app/dossiers/page.tsx
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { DOSSIER_PRICE_EUR } from "../../lib/dossiers";
import DossierBuyForm from "./ui/DossierBuyForm";

export const dynamic = "force-dynamic";

export default async function DossiersPage() {
  // ✅ Auth via eigen JWT-cookie
  const me = getUserFromCookie();
  if (!me?.id) {
    return <main className="p-6">Niet ingelogd.</main>;
  }

  // User ophalen o.b.v. id
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, dossiers: true },
  });

  const money = user?.money ?? 0;
  const dossiers = user?.dossiers ?? 0;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dossiers kopen</h1>
      <p className="text-sm text-gray-700">
        Prijs: €{DOSSIER_PRICE_EUR.toLocaleString("nl-NL")} per dossier •{" "}
        In bezit: <b>{dossiers.toLocaleString("nl-NL")}</b> •{" "}
        Saldo: €{money.toLocaleString("nl-NL")}
      </p>
      <DossierBuyForm />
    </main>
  );
}
