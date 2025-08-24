// app/privileges/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PRIVILEGE_CATALOG } from "@/lib/privileges";
import PrivilegeCard from "../../components/PrivilegeCard";
import { settlePassiveIncome } from "@/lib/passive";

export default async function PrivilegesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return <main className="p-6">Niet ingelogd.</main>;
  }

  // Basis user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return <main className="p-6">User niet gevonden.</main>;

  // Laat uurbetalingen bijschrijven (lazy)
  await settlePassiveIncome(user.id);

  // Actuele waarden tonen (incl. stemmen!)
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { money: true, votes: true, passivePerHour: true },
  });

  // Welke privileges zijn al in bezit?
  const ownedRows = await prisma.userPrivilege.findMany({
    where: { userId: user.id },
    select: { key: true },
  });
  const ownedSet = new Set(ownedRows.map((o) => o.key));

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Privileges</h1>
        <p>
          Huidig passief inkomen:{" "}
          <b>€{(fresh?.passivePerHour ?? 0).toLocaleString("nl-NL")}/uur</b> •{" "}
          Stemmen: <b>{(fresh?.votes ?? 0).toLocaleString("nl-NL")}</b> •{" "}
          Saldo: <b>€{(fresh?.money ?? 0).toLocaleString("nl-NL")}</b>
        </p>
      </div>

      <ul className="grid md:grid-cols-2 gap-4">
        {PRIVILEGE_CATALOG.map((p) => (
          <li key={p.key}>
            <PrivilegeCard item={p} owned={ownedSet.has(p.key)} />
          </li>
        ))}
      </ul>
    </main>
  );
}
