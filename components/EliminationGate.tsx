// components/EliminationGate.tsx
import React from "react";
import RestartButton from "./RestartButton";
import { getUserFromCookie } from "../lib/auth";
import { prisma } from "../lib/prisma";

// Server Component: checkt status en toont óf children óf de reset UI
export default async function EliminationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth
  const me = await getUserFromCookie();
  // Geen user? Laat de rest van de app/layout het verder afhandelen
  if (!me?.id) return <>{children}</>;

  // Lees vers uit DB
  const u = await prisma.user.findUnique({
    where: { id: me.id },
    select: { eliminatedAt: true, hpBP: true },
  });

  const isEliminated = !!u?.eliminatedAt || (u?.hpBP ?? 0) <= 0;

  // Niet eliminated -> render gewoon de app
  if (!isEliminated) return <>{children}</>;

  // Wél eliminated -> toon de gate met reset-knop
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
