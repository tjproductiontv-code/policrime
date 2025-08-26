// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function NavItem({
  href,
  children,
  disabled = false,
  title,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const pathname = usePathname() || "/";
  const active = pathname === href || pathname.startsWith(href + "/");
  const base =
    "group flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50";
  const activeCls = active
    ? "bg-gray-100 font-medium text-gray-900"
    : "text-gray-700";
  const content = (
    <>
      <span className="truncate">{children}</span>
      {disabled && (
        <span className="ml-2 text-gray-400" aria-hidden>
          🔒
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <span
        className={`${base} ${activeCls} cursor-not-allowed opacity-60`}
        aria-disabled="true"
        title={title ?? "Nog niet vrijgespeeld"}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${base} ${activeCls}`}
      title={title}
    >
      {content}
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </div>
  );
}

export default function Sidebar({ user }: { user: { id: number } | null }) {
  const router = useRouter();

  const [unlockedStemmen, setUnlockedStemmen] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/game/network/status", {
          cache: "no-store",
        });
        const data = await res.json();
        if (alive) setUnlockedStemmen(Boolean(data?.unlocked));
      } catch {
        if (alive) setUnlockedStemmen(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      router.push("/sign-in");
      router.refresh();
    }
  }

  // 🔐 Alleen tonen als user is ingelogd
  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r bg-white flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">PoliPower</h1>
      </div>

      <nav className="px-2 space-y-1 flex-1 overflow-y-auto">
        <NavItem href="/">Dashboard</NavItem>
        <NavItem href="/earn">Geld verdienen</NavItem>
        <NavItem href="/ranking">Ranking</NavItem>
        <NavItem href="/votes">Stemmen kopen</NavItem>
        <NavItem href="/privileges">Privileges</NavItem>

        <SectionTitle>Kantoor</SectionTitle>
        <NavItem href="/kantoor/onderzoek">Onderzoek</NavItem>
        <NavItem href="/kantoor/personeel">Personeel</NavItem>

        <SectionTitle>Dossiers</SectionTitle>
        <NavItem href="/dossiers">Dossiers kopen</NavItem>
        <NavItem href="/dossiers/use">Dossiers gebruiken</NavItem>

        <SectionTitle>Netwerk</SectionTitle>
        <NavItem href="/netwerk">De Lobby</NavItem>
        <NavItem
          href="/netwerk/stemmen-handel"
          disabled={unlockedStemmen === null ? true : !unlockedStemmen}
          title={
            unlockedStemmen
              ? "Stemmen-handel"
              : "Nog niet vrijgespeeld — bouw je connectie in de Lobby"
          }
        >
          Stemmen-handel
        </NavItem>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left rounded px-3 py-2 bg-red-600 text-white hover:bg-red-700"
        >
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
