// components/DashboardHealthCard.tsx
import { prisma } from "../lib/prisma";
import { getUserFromCookie } from "../lib/auth";

export default async function DashboardHealthCard() {
  const me = getUserFromCookie();
  if (!me?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { hpBP: true }
  });

  const hp = (user?.hpBP ?? 0) / 100; // basispunten -> %
  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-2">Gezondheid</div>
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div className="h-3 bg-green-500" style={{ width: `${hp}%` }} />
      </div>
      <div className="text-sm mt-1">{hp.toFixed(2)}%</div>
    </div>
  );
}
