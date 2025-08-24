// app/eliminated/page.tsx
import { redirect } from "next/navigation";
import { getUserFromCookie } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import EliminationGate from "../../components/EliminationGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EliminatedPage() {
  const me = await getUserFromCookie();
  if (!me?.id) redirect("/login");

  const u = await prisma.user.findUnique({
    where: { id: me.id },
    select: { eliminatedAt: true, hpBP: true },
  });

  const isEliminated = !!u?.eliminatedAt || (u?.hpBP ?? 0) <= 0;

  if (!isEliminated) {
    redirect("/dashboard");
  }

  return <EliminationGate />;
}
