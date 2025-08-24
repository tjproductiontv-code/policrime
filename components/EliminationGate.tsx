// components/EliminationGate.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "../lib/prisma";
import RestartButton from "./RestartButton";

export default async function EliminationGate({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <>{children}</>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    // we checken beide: flag én HP
    select: { eliminatedAt: true, hpBP: true, name: true },
  });

  const isEliminated = Boolean(user?.eliminatedAt) || ((user?.hpBP ?? 0) <= 0);

  if (!isEliminated) return <>{children}</>;

  // ⬇️ Toon hier meteen de herstart-knop
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Schuldig bevonden aan corruptie</h1>
      <p className="text-gray-700">
        Je bent uitgeschakeld door tegenstanders. Je kunt niet langer deelnemen aan het spel.
      </p>

      <div className="mt-4">
        <RestartButton />
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          • Je <b>privileges</b> blijven behouden.<br />
          • Je <b>passief inkomen</b> blijft, maar daalt met <b>10%</b>.<br />
          • Je <b>stemmen</b> worden aangepast: <b>-1000</b> (nooit onder 0).<br />
          • Je voortgang en status worden gereset zodat je weer kunt spelen.
        </p>
      </div>
    </main>
  );
}
