// components/TopStatusBar.tsx
import { prisma } from "../lib/prisma";
import { getUserFromCookie } from "../lib/auth";

export default async function TopStatusBar() {
  const me = await getUserFromCookie();
  if (!me?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { money: true, votes: true, dossiers: true }
  });

  return (
    <div className="mb-4 flex gap-6 text-sm">
      <span>💶 Geld: €{(user?.money ?? 0).toLocaleString("nl-NL")}</span>
      <span>🗳️ Stemmen: {(user?.votes ?? 0).toLocaleString("nl-NL")}</span>
      <span>📁 Dossiers: {user?.dossiers ?? 0}</span>
    </div>
  );
}
