// components/DashboardHealthCard.tsx
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import HealthBar from "@/components/HealthBar";

export default async function DashboardHealthCard() {
  const session = await getServerSession();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { hpBP: true },
  });
  if (!user) return null;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-base font-semibold">Gezondheid</div>
      <HealthBar hpBP={user.hpBP} />
    </div>
  );
}
