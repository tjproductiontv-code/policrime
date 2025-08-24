// app/ranking/page.tsx
import { prisma } from "@/lib/prisma";
import { LEVELS } from "@/lib/levels";

export default async function RankingPage() {
  // 1) Meeste stemmen
  const topVotes = await prisma.user.findMany({
    orderBy: [{ votes: "desc" }, { money: "desc" }],
    take: 10,
    select: { id: true, name: true, votes: true, money: true },
  });

  // 2) Hoogste rang (level)
  const topLevels = await prisma.user.findMany({
    orderBy: [{ level: "desc" }, { levelProgress: "desc" }],
    take: 10,
    select: { id: true, name: true, level: true, levelProgress: true },
  });

  // 3) Rijkste spelers
  const richest = await prisma.user.findMany({
    orderBy: [{ money: "desc" }, { votes: "desc" }],
    take: 10,
    select: { id: true, name: true, money: true, votes: true },
  });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      {/* 2 per rij op md+; 1 per rij op mobiel */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Meeste stemmen */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">🏆 Meeste stemmen</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Speler</th>
                <th className="py-2 pr-4">Stemmen</th>
              </tr>
            </thead>
            <tbody>
              {topVotes.map((u, i) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.votes.toLocaleString("nl-NL")}</td>
                </tr>
              ))}
              {topVotes.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4">Nog geen spelers met stemmen.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Hoogste rang */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">⚔️ Hoogste rang</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Speler</th>
                <th className="py-2 pr-4">Level</th>
                <th className="py-2 pr-4">Rang</th>
                <th className="py-2 pr-4">Progress</th>
              </tr>
            </thead>
            <tbody>
              {topLevels.map((u, i) => {
                const info = LEVELS[u.level] ?? { title: "Onbekend" };
                return (
                  <tr key={u.id} className="border-b">
                    <td className="py-2 pr-4">{i + 1}</td>
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.level}</td>
                    <td className="py-2 pr-4">{info.title}</td>
                    <td className="py-2 pr-4">{u.levelProgress.toFixed(2)}%</td>
                  </tr>
                );
              })}
              {topLevels.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4">Nog geen spelers met levels.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Rijkste spelers — komt automatisch op de volgende rij links */}
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">💰 Rijkste spelers</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Speler</th>
                <th className="py-2 pr-4">Geld</th>
                <th className="py-2 pr-4">Stemmen</th>
              </tr>
            </thead>
            <tbody>
              {richest.map((u, i) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">€{u.money.toLocaleString("nl-NL")}</td>
                  <td className="py-2 pr-4">{u.votes.toLocaleString("nl-NL")}</td>
                </tr>
              ))}
              {richest.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4">Nog geen spelers met saldo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
