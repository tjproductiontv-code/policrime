// app/layout.tsx
import "./globals.css";
import Sidebar from "../components/Sidebar";
import TopStatusBar from "../components/TopStatusBar";
import EliminationGate from "../components/EliminationGate";
import PassiveIncomeGate from "../components/PassiveIncomeGate";

export const metadata = { title: "PoliPower", description: "Corruptie game" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-dvh flex">
          <aside className="w-64 shrink-0 border-r bg-white">
            <Sidebar />
          </aside>

          <main className="flex-1 p-6">
            <PassiveIncomeGate />
            <TopStatusBar />
            <EliminationGate>{children}</EliminationGate>
          </main>
        </div>
      </body>
    </html>
  );
}
