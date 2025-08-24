// app/votes/page.tsx
import { redirect } from "next/navigation";
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import BuyVotesForm from "../../components/BuyVotesForm";
import { VOTE_PRICE } from "../../lib/game";

export default async function VotesPage() {
  const me = getUserFromCookie();
  if (!me?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, votes: true },
  });

  if (!user) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">User niet gevonden</h1>
        <p>Probeer opnieuw in te loggen via <code>/sign-in</code>.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Stemmen kopen</h1>
        <p>
          Saldo: €{(user.money ?? 0).toLocaleString("nl-NL")} • Jouw stemmen:{" "}
          {(user.votes ?? 0).toLocaleString("nl-NL")}
        </p>
      </div>

      <BuyVotesForm price={VOTE_PRICE} />
      <p className="text-sm text-gray-500">Stemmen bepalen de ranking.</p>
    </main>
  );
}
