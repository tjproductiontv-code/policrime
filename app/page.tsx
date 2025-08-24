// app/page.tsx
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/lib/levels";
import ProgressBar from "../components/ProgressBar";
import AddProgressButton from "../components/AddProgressButton";
import { SpendButton } from "../components/SpendButton";
import DashboardHealthCard from "../components/DashboardHealthCard"; // ← nieuw

export const revalidate = 0
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Niet ingelogd</h1>
        <p>
          Ga naar <code>/sign-in</code> om in te loggen.
        </p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, money: true, level: true, levelProgress: true },
  });

  const displayName = session.user.name ?? user?.name ?? session.user.email;
  const money = user?.money ?? 0;
  const level = user?.level ?? 1;
  const progress = user?.levelProgress ?? 0;
  const info = LEVELS[level] ?? { title: "Onbekend", description: "" };

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Welkom {displayName}</h2>
        <p className="mt-1">Saldo: €{money.toLocaleString("nl-NL")}</p>
      </div>

      {/* Rang + progress */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold">Jouw rang: {info.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{info.description}</p>
        <ProgressBar value={progress} />
        <AddProgressButton />
      </div>

      {/* Health kaart */}
      <DashboardHealthCard /> {/* ← hier komt je ❤️ HP-balk */}

   
    </main>
  );
}
