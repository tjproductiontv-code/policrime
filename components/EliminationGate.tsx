// components/EliminationGate.tsx
import React from "react";
import RestartButton from "./RestartButton";
import { getUserFromCookie } from "../lib/auth";
import { prisma } from "../lib/prisma";

export default async function EliminationGate({
  children,
}: {
  children?: React.ReactNode; // ✅ optioneel maken
}) {
  const me = await getUserFromCookie();
  if (!me?.id) return <>{children}</>; // niet ingelogd? laat layout verder afhandelen

  const u = await prisma.user.findUnique({
    where: { id: me.id },
    select: { eliminatedAt: true, hpBP: true },
  });

  const isEliminated = !!u?.eliminatedAt || (u?.hpBP ?? 0) <= 0;

  if (!isEliminated) {
    // Actief: render de app content (of niets als er geen children zijn)
    return <>{children}</>;
  }

  // Uitgeschakeld: toon de reset UI
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Je bent uitgeschakeld</h1>
      <p className="text-gray-700">Probeer later opnieuw of reset je spel.</p>

      <div className="mt-2">
        <RestartButton />
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          • Je <b>personeel</b> blijft behouden.<br />
          • Je <b>stemmen</b>: <b>-1000</b> (min. 0).<br />
          • Je <b>dossiers</b> worden gehalveerd.<br />
          • Je <b>level</b> gaat terug naar 1.
        </p>
      </div>
    </main>
  );
}
