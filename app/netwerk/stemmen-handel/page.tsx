// app/netwerk/stemmen-handel/page.tsx
import { prisma } from "../../../lib/prisma";
import { getUserFromCookie } from "../../../lib/auth";
import StemmenHandelClient from "../../../components/StemmenHandelClient"; // ✅ import

export const dynamic = "force-dynamic";

function pctFromBps(bps: number) {
  return (bps / 100).toFixed(2) + "%";
}

export default async function StemmenHandelPage() {
  const me = await getUserFromCookie();
  if (!me?.id) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Stemmen-handel</h1>
        <p>Niet ingelogd.</p>
      </main>
    );
  }

  const uc = await prisma.userConnection.findUnique({
    where: { userId_key: { userId: me.id, key: "anika" } },
    select: { level: true, progressBps: true },
  });

  const level = uc?.level ?? 0;
  const progressBps = uc?.progressBps ?? 0;

  if (level < 1) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Stemmen-handel</h1>
        <p className="text-red-700">
          Helaas, je connectie is nog niet sterk genoeg.
        </p>
        <p>
          Huidige progressie: {pctFromBps(progressBps)} (Level {level || 1})
        </p>
        <div className="h-3 rounded bg-gray-200 overflow-hidden">
          <div
            className="h-3 bg-emerald-600"
            style={{ width: `${Math.min(100, progressBps / 100)}%` }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Stemmen-handel</h1>
      <p className="text-gray-600">
        Actuele korting verandert elke 30 minuten. (level {level})
      </p>
      <StemmenHandelClient />
    </main>
  );
}
