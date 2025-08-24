// app/dashboard/page.tsx
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import Countdown from "../../components/Countdown";
import { settlePassiveIncome } from "../../lib/passive";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // ✅ Auth via eigen JWT-cookie
  const me = getUserFromCookie();
  if (!me?.id) {
    return <main className="p-6">Niet ingelogd.</main>;
  }

  // 1) Haal user op (incl. name)
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, name: true, money: true, passivePerHour: true, lastPassiveAt: true },
  });
  if (!user) return <main className="p-6">User niet gevonden.</main>;

  // 2) Lazy accrual
  await settlePassiveIncome(user.id);

  // 3) Opnieuw ophalen (incl. name)
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, money: true, passivePerHour: true, lastPassiveAt: true },
  });

  const username = fresh?.name ?? user.name;
  const money = fresh?.money ?? user.money ?? 0;
  const perHour = fresh?.passivePerHour ?? user.passivePerHour ?? 0;

  const nextISO =
    fresh?.lastPassiveAt
      ? new Date(fresh.lastPassiveAt.getTime() + 60 * 60 * 1000).toISOString()
      : null;

  return (
    <main className="p-6 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Welkom, {username}</h1>
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-1">Passief inkomen</div>
        <p>€{perHour.toLocaleString("nl-NL")} per uur</p>

        <p className="text-sm text-gray-600">
          Saldo: €{money.toLocaleString("nl-NL")}
        </p>

        {perHour > 0 ? (
          nextISO ? (
            <p className="text-sm text-gray-600">
              Volgende uitbetaling over <Countdown until={nextISO} />
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Passief inkomen actief. De eerste uitbetaling start vanaf nu.
            </p>
          )
        ) : (
          <p className="text-sm text-gray-600">
            Nog geen passief inkomen. Koop <b>Privileges</b> om dit te activeren.
          </p>
        )}
      </div>

      {/* … rest van je dashboard … */}
    </main>
  );
}
