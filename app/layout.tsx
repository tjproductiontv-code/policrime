// app/layout.tsx
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
  // Lees JWT uit cookie; { id: number } | null
  const me = getUserFromCookie();

  return (
    <html lang="nl">
      <body>
        <div className="min-h-dvh flex">
          {/* Sidebar links */}
          <aside className="w-64 shrink-0 border-r bg-white">
            <Sidebar />
          </aside>

          {/* Content rechts */}
          <main className="flex-1 p-6">
            {/* Alleen tonen als je ingelogd bent; anders kunnen deze SSR-componenten crashen of niets renderen */}
            {me?.id ? (
              <>
                <PassiveIncomeGate />
                <TopStatusBar />
                <EliminationGate>{children}</EliminationGate>
              </>
            ) : (
              // Niet ingelogd: toon gewoon de pagina-inhoud (bijv. sign-in, landing, etc.)
              <>{children}</>
            )}
          </main>
        </div>
      </body>
    </html>
  );
}
