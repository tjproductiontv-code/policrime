// components/EliminationGate.tsx
import { prisma } from "../lib/prisma";
import { getUserFromCookie } from "../lib/auth";

export default async function EliminationGate({ children }: { children: React.ReactNode }) {
  const me = getUserFromCookie();
  if (!me?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { eliminatedAt: true }
  });

  if (user?.eliminatedAt) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Je bent uitgeschakeld</h2>
        <p>Probeer later opnieuw of reset je spel.</p>
      </div>
    );
  }

  return <>{children}</>;
}
