import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import BuyVotesForm from "../../components/BuyVotesForm";
import { VOTE_PRICE } from "@/lib/game";

export default async function VotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Niet ingelogd</h1>
        <p>Ga naar <code>/sign-in</code> om in te loggen.</p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { money: true, votes: true },
  });

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Stemmen kopen</h1>
        <p>Saldo: €{user?.money ?? 0} • Jouw stemmen: {user?.votes ?? 0}</p>
      </div>

      <BuyVotesForm price={VOTE_PRICE} />
      <p className="text-sm text-gray-500">Stemmen bepalen de ranking.</p>
    </main>
  );
}
