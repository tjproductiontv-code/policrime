// app/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";

import Sidebar from "../components/Sidebar";
import TopStatusBar from "../components/TopStatusBar";
import EliminationGate from "../components/EliminationGate";
import PassiveIncomeGate from "../components/PassiveIncomeGate";
import { getUserFromCookie } from "../lib/auth";

export const metadata = {
  title: "PoliPower",
  description: "Corruptie game",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Correct gebruik van async functie
  const me = await getUserFromCookie();

  return (
    <html lang="nl">
      <body>
        <div className="min-h-dvh flex">
          {/* Sidebar links */}
          <aside className="w-64 shrink-0 border-r bg-white">
            <Sidebar user={me} /> {/* 👈 Geef user door aan Sidebar */}
          </aside>

          {/* Content rechts */}
          <main className="flex-1 p-6">
            {/* Alleen tonen als je ingelogd bent */}
            {me?.id ? (
              <>
                <PassiveIncomeGate />
                <TopStatusBar />
                <EliminationGate>{children}</EliminationGate>
              </>
            ) : (
              // Niet ingelogd: toon alleen content
              <>{children}</>
            )}
          </main>
        </div>
      </body>
    </html>
  );
}
